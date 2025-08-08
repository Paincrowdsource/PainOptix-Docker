import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const imagePath = path.join(process.cwd(), 'public/medical-illustrations/exercises/Bridges Pose.png');
  const exists = fs.existsSync(imagePath);
  
  return NextResponse.json({
    imagePath,
    exists,
    publicDir: fs.readdirSync(path.join(process.cwd(), 'public')),
    exercisesDir: exists ? fs.readdirSync(path.join(process.cwd(), 'public/medical-illustrations/exercises')).slice(0, 5) : 'Not found'
  });
}