-- Add weekDays column to Goal table
ALTER TABLE "Goal" ADD COLUMN "weekDays" INTEGER[] DEFAULT '{}';