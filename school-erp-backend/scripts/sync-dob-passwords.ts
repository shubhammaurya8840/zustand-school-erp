import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

function formatDobToPassword(dob: Date | string | null | undefined): string {
  if (!dob) return '';
  const d = new Date(dob);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  return `${day}${month}${year}`;
}

async function main() {
  console.log('--- Syncing Students & Teachers DOB Passwords ---');

  // 1. Sync all students
  const students = await prisma.student.findMany({
    include: { user: true },
  });

  console.log(`Found ${students.length} students.`);
  for (const s of students) {
    const dobPass = formatDobToPassword(s.dob);
    console.log(`Student: ${s.firstName} ${s.lastName} (${s.admissionNo}), DOB: ${s.dob.toISOString().split('T')[0]}, Password: ${dobPass}`);
    if (s.userId && dobPass) {
      const passwordHash = await bcrypt.hash(dobPass, 12);
      await prisma.user.update({
        where: { id: s.userId },
        data: {
          passwordHash,
          mustChangePassword: true,
          isActive: true,
        },
      });
      console.log(`  ✓ Updated user password hash for ${s.admissionNo} to DOB ${dobPass}`);
    }
  }

  // 2. Sync all teachers/staff
  const staffMembers = await prisma.staff.findMany({
    include: { user: true },
  });

  console.log(`Found ${staffMembers.length} staff members.`);
  for (const st of staffMembers) {
    let dob = st.dob;
    // If staff doesn't have DOB set, set a reasonable default e.g. 15 Aug 1986 -> 15081986
    if (!dob) {
      dob = new Date('1986-08-15');
      await prisma.staff.update({
        where: { id: st.id },
        data: { dob },
      });
      console.log(`  Set default DOB 1986-08-15 for staff ${st.firstName} ${st.lastName} (${st.employeeId})`);
    }

    const dobPass = formatDobToPassword(dob);
    console.log(`Staff: ${st.firstName} ${st.lastName} (${st.employeeId}), DOB: ${dobPass}`);
    if (st.userId && dobPass) {
      const passwordHash = await bcrypt.hash(dobPass, 12);
      await prisma.user.update({
        where: { id: st.userId },
        data: {
          passwordHash,
          mustChangePassword: true,
          isActive: true,
        },
      });
      console.log(`  ✓ Updated user password hash for ${st.employeeId} to DOB ${dobPass}`);
    }
  }

  console.log('✓ DOB Passwords synchronization complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

