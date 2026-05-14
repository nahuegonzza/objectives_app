import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getServerSupabaseUser, ensurePrismaUserForSession } from '@lib/supabase-server';

export async function GET() {
  try {
    const { user, isServiceRole, serviceRoleAvailable } = await getServerSupabaseUser();
    
    // ❌ NO fallback a usuario por defecto - si no hay sesión, denegar acceso
    let userId: string | undefined;
    if (user?.id) {
      userId = user.id;
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // CRITICAL: Verify the userId matches the authenticated user
    // This prevents reading wrong user data due to cookie/session issues
    if (user && user.email) {
      const dbUserByEmail = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true }
      });
      
      // If user exists in DB with different ID, something is wrong with the session
      if (dbUserByEmail && dbUserByEmail.id !== userId) {
        return NextResponse.json({ error: 'Session error - please re-login' }, { status: 403 });
      }
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!dbUser && user) {
      // Create user if doesn't exist, then fetch full record
      await ensurePrismaUserForSession();
      dbUser = await prisma.user.findUnique({
        where: { id: userId }
      });
    }
    // Remove the automatic update that was overwriting data
    // else if (dbUser && user) {
    //   dbUser = await ensurePrismaUserForSession();
    // }

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only enrich from Supabase metadata if BOTH firstName AND lastName are missing
    // Don't overwrite existing data with null values
    if (user && !dbUser.firstName && !dbUser.lastName) {
      const metadata = user.user_metadata as Record<string, any> | undefined;

      const enrichedUser = {
        ...dbUser,
        firstName: dbUser.firstName || (metadata?.first_name ?? metadata?.firstName) || null,
        lastName: dbUser.lastName || (metadata?.last_name ?? metadata?.lastName) || null,
        birthDate: dbUser.birthDate || (metadata?.birth_date ?? metadata?.birthDate ? new Date(metadata.birth_date ?? metadata.birthDate) : null),
        name: dbUser.name || (([dbUser.firstName || (metadata?.first_name ?? metadata?.firstName), dbUser.lastName || (metadata?.last_name ?? metadata?.lastName)].filter(Boolean).join(' ')) || null)
      };

      // Only update database if we actually got new data from Supabase metadata (not null)
      const hasNewFirstName = enrichedUser.firstName && enrichedUser.firstName !== dbUser.firstName;
      const hasNewLastName = enrichedUser.lastName && enrichedUser.lastName !== dbUser.lastName;
      
      if (hasNewFirstName || hasNewLastName) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            firstName: enrichedUser.firstName,
            lastName: enrichedUser.lastName,
            // birthDate: enrichedUser.birthDate, // TODO: Uncomment after migration is applied
            name: enrichedUser.name
          }
        });
        // Return enriched data only if we actually updated
        return NextResponse.json(enrichedUser);
      }

      // No new data from Supabase, return original database user
      return NextResponse.json(dbUser);
    }

    return NextResponse.json(dbUser);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching user' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, isServiceRole, serviceRoleAvailable } = await getServerSupabaseUser();
    
    // ❌ NO fallback a usuario por defecto - si no hay sesión, denegar acceso
    let userId: string | undefined;
    if (user?.id) {
      userId = user.id;
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // CRITICAL: Verify the userId matches the authenticated user
    // This prevents cross-user data overwrites due to cookie/session issues
    if (user && user.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true }
      });
      
      // If user exists in DB, the ID must match the session user ID
      if (dbUser && dbUser.id !== userId) {
        return NextResponse.json({ error: 'Session error - please re-login' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { firstName, lastName, birthDate, username } = body;

    // Only update fields that are explicitly provided in the request
    // Don't overwrite existing data with null when field is not provided
    const data: any = {};

    // Only add firstName if it's explicitly provided (not undefined)
    if (firstName !== undefined) {
      data.firstName = firstName?.trim() || null;
    }

    // Only add lastName if it's explicitly provided (not undefined)
    if (lastName !== undefined) {
      data.lastName = lastName?.trim() || null;
    }

    // Only update name if both firstName and lastName are provided
    if (firstName !== undefined && lastName !== undefined) {
      data.name = firstName?.trim() && lastName?.trim() 
        ? `${firstName.trim()} ${lastName.trim()}` 
        : firstName?.trim() || lastName?.trim() || null;
    }

    // Handle username update
    if (username !== undefined) {
      const normalizedUsername = username ? username.trim() : null;
      
      if (normalizedUsername) {
        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
        if (!usernameRegex.test(normalizedUsername)) {
          return NextResponse.json(
            { error: 'El nombre de usuario debe tener 3-20 caracteres y solo contener letras, números, guiones y guiones bajos' },
            { status: 400 }
          );
        }

        // Check if username is already taken by another user (case-insensitive)
        const existingUser = await prisma.user.findFirst({
          where: {
            username: {
              equals: normalizedUsername,
              mode: 'insensitive'
            }
          },
          select: { id: true }
        });

        if (existingUser && existingUser.id !== userId) {
          return NextResponse.json(
            { error: 'Este nombre de usuario ya está en uso' },
            { status: 409 }
          );
        }
      }

      data.username = normalizedUsername;
    }

    // Handle birthDate update
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

    // Security check: Verify the session user matches the database user
    // This prevents cross-user data overwrites due to session/cookie issues
    if (user) {
      const dbUserByEmail = await prisma.user.findUnique({
        where: { email: email! },
        select: { id: true }
      });
      
      // If user exists in DB with different ID, something is wrong with the session
      if (dbUserByEmail && dbUserByEmail.id !== userId) {
        return NextResponse.json({ error: 'Session mismatch - please re-login' }, { status: 403 });
      }
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
            username: data.username,
          },
        })
      : await prisma.user.update({
          where: { id: userId },
          data,
        });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
  }
}
