import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getServerSupabaseUser, ensurePrismaUserForSession } from '@lib/supabase-server';

export async function GET() {
  try {
    const { user, isServiceRole, serviceRoleAvailable } = await getServerSupabaseUser();
    
    let userId: string | undefined;
    if (user?.id) {
      userId = user.id;
    } else if (isServiceRole && serviceRoleAvailable) {
      userId = process.env.DEFAULT_USER_ID;
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!dbUser && user) {
      dbUser = await ensurePrismaUserForSession();
    } else if (dbUser && user) {
      // Ensure user data is up to date
      dbUser = await ensurePrismaUserForSession();
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user has incomplete data, try to enrich from Supabase metadata
    if (user && (!dbUser.firstName || !dbUser.lastName || !dbUser.birthDate)) {
      const metadata = user.user_metadata as Record<string, any> | undefined;
      const enrichedUser = {
        ...dbUser,
        firstName: dbUser.firstName || (metadata?.first_name ?? metadata?.firstName) || null,
        lastName: dbUser.lastName || (metadata?.last_name ?? metadata?.lastName) || null,
        birthDate: dbUser.birthDate || (metadata?.birth_date ?? metadata?.birthDate ? new Date(metadata.birth_date ?? metadata.birthDate) : null),
        name: dbUser.name || (([dbUser.firstName || (metadata?.first_name ?? metadata?.firstName), dbUser.lastName || (metadata?.last_name ?? metadata?.lastName)].filter(Boolean).join(' ')) || null)
      };

      // Update the database with enriched data
      if (enrichedUser.firstName !== dbUser.firstName || enrichedUser.lastName !== dbUser.lastName || enrichedUser.birthDate !== dbUser.birthDate) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            firstName: enrichedUser.firstName,
            lastName: enrichedUser.lastName,
            birthDate: enrichedUser.birthDate,
            name: enrichedUser.name
          }
        });
      }

      return NextResponse.json(enrichedUser);
    }

    return NextResponse.json(dbUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Error fetching user' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, isServiceRole, serviceRoleAvailable } = await getServerSupabaseUser();
    
    let userId: string | undefined;
    if (user?.id) {
      userId = user.id;
    } else if (isServiceRole && serviceRoleAvailable) {
      userId = process.env.DEFAULT_USER_ID;
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, birthDate } = body;

    const data: any = {
      firstName: firstName || null,
      lastName: lastName || null,
      name: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || null,
    };

    if (birthDate) {
      const date = new Date(birthDate);
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: 'Invalid birthDate' }, { status: 400 });
      }
      data.birthDate = date;
    } else if (birthDate === '') {
      data.birthDate = null;
    }

    const email = user?.email;
    if (user && !email) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    const updatedUser = user
      ? await prisma.user.upsert({
          where: { id: userId },
          update: data,
          create: {
            id: userId,
            email: email!,
            firstName: data.firstName,
            lastName: data.lastName,
            name: data.name,
          },
        })
      : await prisma.user.update({
          where: { id: userId },
          data,
        });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
  }
}