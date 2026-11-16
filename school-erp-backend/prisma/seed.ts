import { PrismaClient, Role, StudentStatus, StaffStatus, DayOfWeek } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('--- Purging Stale Data & Seeding Clean Zustand Public School ERP ---');

  // 1. Clean ALL transactional, mock, and stale records in reverse dependency order
  console.log('1. Purging all database tables...');
  await prisma.auditLog.deleteMany({});
  await prisma.noticeRead.deleteMany({});
  await prisma.notice.deleteMany({});
  await prisma.homeworkSubmission.deleteMany({});
  await prisma.homework.deleteMany({});
  await prisma.examResult.deleteMany({});
  await prisma.examSchedule.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.studentAttendance.deleteMany({});
  await prisma.staffAttendance.deleteMany({});
  await prisma.feePayment.deleteMany({});
  await prisma.studentFee.deleteMany({});
  await prisma.feeStructure.deleteMany({});
  await prisma.bookIssue.deleteMany({});
  await prisma.book.deleteMany({});
  await prisma.timetablePeriod.deleteMany({});
  await prisma.teacherAssignment.deleteMany({});
  await prisma.studentClassEnrollment.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.parent.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.user.deleteMany({}); // Wipe out all users so zero fake staff (e.g. Teacher 1) remains!

  console.log('✓ All database tables cleaned to a pure fresh state.');

  // 2. School Settings Singleton
  const schoolSettings = await prisma.schoolSettings.upsert({
    where: { id: 'default-school-settings' },
    update: {
      schoolName: 'Zustand Public School',
      tagline: 'Knowledge | Character | Bright Future',
      logoPath: '/school-logo.svg',
      address: '108 Academic Enclave, Vidya Nagar, New Delhi - 110001',
      phone: '+91 (011) 2345-6789',
      email: 'info@zustandpublicschool.edu.in',
      website: 'https://zustandpublicschool.edu.in',
      affiliationNo: 'CBSE-AFF-2026/89432',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    create: {
      id: 'default-school-settings',
      schoolName: 'Zustand Public School',
      tagline: 'Knowledge | Character | Bright Future',
      logoPath: '/school-logo.svg',
      address: '108 Academic Enclave, Vidya Nagar, New Delhi - 110001',
      phone: '+91 (011) 2345-6789',
      email: 'info@zustandpublicschool.edu.in',
      website: 'https://zustandpublicschool.edu.in',
      affiliationNo: 'CBSE-AFF-2026/89432',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
  });
  console.log(`✓ School Settings: ${schoolSettings.schoolName}`);

  // 3. Academic Session (2026-2027)
  const currentSession = await prisma.academicSession.upsert({
    where: { name: '2026-2027' },
    update: { isCurrent: true },
    create: {
      name: '2026-2027',
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2027-03-31T23:59:59.999Z'),
      isCurrent: true,
    },
  });
  console.log(`✓ Academic Session: ${currentSession.name}`);

  await prisma.schoolSettings.update({
    where: { id: schoolSettings.id },
    data: { currentSessionId: currentSession.id },
  });

  // 4. Classes and Sections (Pre-Nursery to Class 12)
  const classList = [
    { name: 'Pre-Nursery', numericOrder: 0, code: 'PRE_NUR' },
    { name: 'Nursery', numericOrder: 1, code: 'NUR' },
    { name: 'Kindergarten', numericOrder: 2, code: 'KG' },
    { name: 'Class 1', numericOrder: 3, code: 'C01' },
    { name: 'Class 2', numericOrder: 4, code: 'C02' },
    { name: 'Class 3', numericOrder: 5, code: 'C03' },
    { name: 'Class 4', numericOrder: 6, code: 'C04' },
    { name: 'Class 5', numericOrder: 7, code: 'C05' },
    { name: 'Class 6', numericOrder: 8, code: 'C06' },
    { name: 'Class 7', numericOrder: 9, code: 'C07' },
    { name: 'Class 8', numericOrder: 10, code: 'C08' },
    { name: 'Class 9', numericOrder: 11, code: 'C09' },
    { name: 'Class 10', numericOrder: 12, code: 'C10' },
    { name: 'Class 11', numericOrder: 13, code: 'C11', stream: 'Science' },
    { name: 'Class 12', numericOrder: 14, code: 'C12', stream: 'Science' },
  ];

  const createdClasses: Record<string, any> = {};
  const createdSections: Record<string, any> = {};

  for (const c of classList) {
    const createdClass = await prisma.class.upsert({
      where: { code: c.code },
      update: {
        name: c.name,
        numericOrder: c.numericOrder,
        stream: c.stream || null,
      },
      create: {
        name: c.name,
        numericOrder: c.numericOrder,
        code: c.code,
        stream: c.stream || null,
      },
    });
    createdClasses[c.code] = createdClass;

    for (const secName of ['A', 'B']) {
      const sec = await prisma.section.upsert({
        where: {
          classId_name: {
            classId: createdClass.id,
            name: secName,
          },
        },
        update: {},
        create: {
          name: secName,
          classId: createdClass.id,
          capacity: 40,
        },
      });
      createdSections[`${c.code}-${secName}`] = sec;
    }
  }
  console.log('✓ Classes (Pre-Nursery to Class 12) & Sections created.');

  // 5. Master Fee Heads
  const feeHeads = [
    { name: 'Tuition Fee', code: 'TUIT', isRefundable: false },
    { name: 'Admission & Registration Fee', code: 'ADM', isRefundable: false },
    { name: 'Examination & Assessment Fee', code: 'EXAM', isRefundable: false },
    { name: 'Science & Computer Lab Fee', code: 'LAB', isRefundable: false },
    { name: 'Library & Digital Resource Fee', code: 'LIB', isRefundable: false },
    { name: 'Sports & Cultural Activity Fee', code: 'SPORTS', isRefundable: false },
    { name: 'Annual Development Fee', code: 'DEV', isRefundable: false },
    { name: 'Security Caution Deposit', code: 'CAUT', isRefundable: true },
  ];

  const createdFeeHeads: Record<string, any> = {};
  for (const fh of feeHeads) {
    const f = await prisma.feeHead.upsert({
      where: { code: fh.code },
      update: { name: fh.name, isRefundable: fh.isRefundable },
      create: fh,
    });
    createdFeeHeads[fh.code] = f;
  }
  console.log('✓ Master Fee Heads registered.');

  // 6. Master Subjects
  const subjects = [
    { name: 'English Core & Literature', code: 'ENG-CORE', type: 'THEORY' },
    { name: 'Mathematics', code: 'MATH-CORE', type: 'THEORY' },
    { name: 'General Science', code: 'SCI-GEN', type: 'THEORY' },
    { name: 'Social Studies', code: 'SST-GEN', type: 'THEORY' },
    { name: 'Hindi Language & Grammar', code: 'HIN-CORE', type: 'THEORY' },
    { name: 'Computer Science & AI', code: 'CS-AI', type: 'PRACTICAL' },
    { name: 'Physics & Experimental Lab', code: 'PHY-LAB', type: 'THEORY' },
    { name: 'Chemistry & Practical Lab', code: 'CHEM-LAB', type: 'THEORY' },
    { name: 'Biology & Life Sciences', code: 'BIO-SCI', type: 'THEORY' },
  ];

  const createdSubjects: Record<string, any> = {};
  for (const sub of subjects) {
    const s = await prisma.subject.upsert({
      where: { code: sub.code },
      update: { name: sub.name, type: sub.type },
      create: sub,
    });
    createdSubjects[sub.code] = s;
  }
  console.log('✓ Master Curriculum Subjects registered.');

  // 7. Master Library Categories & Sample Books
  const bookCategories = [
    { name: 'Science & Technology', description: 'Physics, Chemistry, Biology and Engineering' },
    { name: 'Mathematics & Statistics', description: 'Algebra, Geometry, Calculus and Quantitative Methods' },
    { name: 'Computer Science & Coding', description: 'Programming, Data Structures, Web and AI' },
    { name: 'Literature & Languages', description: 'English, Hindi, World Literature and Grammar' },
    { name: 'General Knowledge & Encyclopedias', description: 'Reference, World History and Atlas' },
  ];

  let mathCategory: any = null;
  for (const cat of bookCategories) {
    const createdCat = await prisma.bookCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description, isActive: true },
      create: { name: cat.name, description: cat.description, isActive: true },
    });
    if (cat.name === 'Mathematics & Statistics') mathCategory = createdCat;
  }

  if (mathCategory) {
    await prisma.book.create({
      data: {
        isbn: '978-0199464739',
        title: 'NCERT Exemplar Mathematics Class 10',
        author: 'NCERT Board of Academics',
        publisher: 'NCERT Publications',
        category: 'Mathematics & Statistics',
        categoryId: mathCategory.id,
        totalCopies: 5,
        availableCopies: 5,
        rackLocation: 'Shelf M-02',
        barcode: 'BK-MATH-10-001',
        status: 'ACTIVE',
      },
    });
  }
  console.log('✓ Master Library Categories & Books initialized.');

  // 8. Bootstrap Clean Official Accounts (1 Per Role)
  const saltRounds = 10;

  // --- ACCOUNT 1: ADMIN (Principal) ---
  const adminPasswordHash = await bcrypt.hash('AdminSecure2026!@', saltRounds);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@zustand.edu',
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: Role.SCHOOL_ADMIN,
      isActive: true,
    },
  });

  await prisma.staff.create({
    data: {
      userId: adminUser.id,
      employeeId: 'ADM-2026-001',
      firstName: 'Dr. Eleanor',
      lastName: 'Vance',
      role: Role.SCHOOL_ADMIN,
      designation: 'Principal & Executive Director',
      qualification: 'Ph.D in Education Leadership',
      phone: '+91 (011) 2345-6789',
      email: 'admin@zustand.edu',
      joiningDate: new Date('2026-01-01'),
      department: 'School Directorate',
      status: StaffStatus.ACTIVE,
    },
  });
  console.log('✓ [1/6] Admin Account: admin / AdminSecure2026!@');

  // --- ACCOUNT 2: ACCOUNTANT (Bursar) ---
  const accountantPasswordHash = await bcrypt.hash('AccountantSecure2026!@', saltRounds);
  const accountantUser = await prisma.user.create({
    data: {
      email: 'accountant@zustand.edu',
      username: 'accountant',
      passwordHash: accountantPasswordHash,
      role: Role.ACCOUNTANT,
      isActive: true,
    },
  });

  await prisma.staff.create({
    data: {
      userId: accountantUser.id,
      employeeId: 'ACC-2026-001',
      firstName: 'Marcus',
      lastName: 'Sterling',
      role: Role.ACCOUNTANT,
      designation: 'Chief Bursar & Head of Accounts',
      qualification: 'CPA, M.Com',
      phone: '+91 98765 00014',
      email: 'accountant@zustand.edu',
      joiningDate: new Date('2026-01-01'),
      department: 'Treasury & Accounts',
      status: StaffStatus.ACTIVE,
    },
  });
  console.log('✓ [2/6] Accountant Account: accountant / AccountantSecure2026!@');

  // --- ACCOUNT 3: TEACHER (Senior Faculty) ---
  const teacherPasswordHash = await bcrypt.hash('TeacherSecure2026!@', saltRounds);
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@zustand.edu',
      username: 'teacher',
      passwordHash: teacherPasswordHash,
      role: Role.TEACHER,
      isActive: true,
    },
  });

  const teacherStaff = await prisma.staff.create({
    data: {
      userId: teacherUser.id,
      employeeId: 'TCH-2026-001',
      firstName: 'Prof. Clara',
      lastName: 'Higgins',
      role: Role.TEACHER,
      designation: 'Senior Faculty (Mathematics)',
      qualification: 'M.Sc., B.Ed',
      phone: '+91 98765 00042',
      email: 'teacher@zustand.edu',
      joiningDate: new Date('2026-01-01'),
      department: 'STEM Department',
      status: StaffStatus.ACTIVE,
    },
  });
  console.log('✓ [3/6] Teacher Account: teacher / TeacherSecure2026!@');

  // --- ACCOUNT 4: LIBRARIAN (Resource Head) ---
  const librarianPasswordHash = await bcrypt.hash('LibrarianSecure2026!@', saltRounds);
  const librarianUser = await prisma.user.create({
    data: {
      email: 'librarian@zustand.edu',
      username: 'librarian',
      passwordHash: librarianPasswordHash,
      role: Role.LIBRARIAN,
      isActive: true,
    },
  });

  await prisma.staff.create({
    data: {
      userId: librarianUser.id,
      employeeId: 'LIB-2026-001',
      firstName: 'Julian',
      lastName: 'Montgomery',
      role: Role.LIBRARIAN,
      designation: 'Head of Library & Media Archives',
      qualification: 'M.Lib.Sc',
      phone: '+91 98765 00008',
      email: 'librarian@zustand.edu',
      joiningDate: new Date('2026-01-01'),
      department: 'Knowledge Resource Center',
      status: StaffStatus.ACTIVE,
    },
  });
  console.log('✓ [4/6] Librarian Account: librarian / LibrarianSecure2026!@');

  // --- ACCOUNT 5: PARENT (Guardian) ---
  const parentPasswordHash = await bcrypt.hash('ParentSecure2026!@', saltRounds);
  const parentUser = await prisma.user.create({
    data: {
      email: 'parent@zustand.edu',
      username: 'parent',
      passwordHash: parentPasswordHash,
      role: Role.PARENT,
      isActive: true,
    },
  });

  const parentProfile = await prisma.parent.create({
    data: {
      userId: parentUser.id,
      fatherName: 'Rajesh Sharma',
      motherName: 'Sunita Sharma',
      guardianName: 'Rajesh Sharma',
      primaryPhone: '+91 98765 43210',
      alternatePhone: '+91 98765 43211',
      email: 'parent@zustand.edu',
      occupation: 'Senior Software Engineer',
      address: 'Flat 402, Royal Palms, Sector 14, New Delhi',
      emergencyContact: '+91 98765 43210',
      visiblePassword: 'ParentSecure2026!@',
    },
  });
  console.log('✓ [5/6] Parent Account: parent / ParentSecure2026!@');

  // --- ACCOUNT 6: STUDENT (Enrolled in Class 10 - Section A) ---
  const studentPasswordHash = await bcrypt.hash('StudentSecure2026!@', saltRounds);
  const studentUser = await prisma.user.create({
    data: {
      email: 'student@zustand.edu',
      username: 'student',
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
      isActive: true,
    },
  });

  const class10 = createdClasses['C10'];
  const secA = createdSections['C10-A'];

  const studentProfile = await prisma.student.create({
    data: {
      userId: studentUser.id,
      admissionNo: 'ADM-2026-001',
      rollNo: 1,
      firstName: 'Aarav',
      lastName: 'Sharma',
      dob: new Date('2011-05-15'),
      gender: 'Male',
      bloodGroup: 'B+',
      address: 'Flat 402, Royal Palms, Sector 14, New Delhi',
      emergencyContact: '+91 98765 43210',
      status: StudentStatus.ACTIVE,
      classId: class10.id,
      sectionId: secA.id,
      parentId: parentProfile.id,
      joinedDate: new Date('2026-04-01'),
    },
  });

  // Enroll student in current session
  await prisma.studentClassEnrollment.create({
    data: {
      studentId: studentProfile.id,
      sessionId: currentSession.id,
      classId: class10.id,
      sectionId: secA.id,
    },
  });
  console.log('✓ [6/6] Student Account: student (or ADM-2026-001) / StudentSecure2026!@');

  // 9. Link Teacher & Student Data (Assignments, Timetable, Fee, Attendance, Homework)
  const mathSubject = createdSubjects['MATH-CORE'];

  // Assign Prof. Clara Higgins to Class 10 Section A Mathematics
  await prisma.teacherAssignment.create({
    data: {
      teacherId: teacherStaff.id,
      sessionId: currentSession.id,
      classId: class10.id,
      sectionId: secA.id,
      subjectId: mathSubject.id,
    },
  });

  // Assign Timetable Period: Monday Period 1 (08:30 - 09:15)
  await prisma.timetablePeriod.create({
    data: {
      sessionId: currentSession.id,
      classId: class10.id,
      sectionId: secA.id,
      subjectId: mathSubject.id,
      teacherId: teacherStaff.id,
      dayOfWeek: DayOfWeek.MONDAY,
      periodNo: 1,
      startTime: '08:30',
      endTime: '09:15',
      roomNo: 'Room 201',
    },
  });

  // Fee Invoice for Aarav Sharma (Tuition Fee Q1)
  await prisma.studentFee.create({
    data: {
      studentId: studentProfile.id,
      sessionId: currentSession.id,
      totalAmount: 4500,
      paidAmount: 0,
      discountAmount: 0,
      dueAmount: 4500,
      status: 'PENDING',
    },
  });

  // Today's Attendance for Aarav
  await prisma.studentAttendance.create({
    data: {
      studentId: studentProfile.id,
      sessionId: currentSession.id,
      classId: class10.id,
      sectionId: secA.id,
      date: new Date(),
      status: 'PRESENT',
    },
  });

  // Homework in Mathematics for Class 10 Section A
  await prisma.homework.create({
    data: {
      sessionId: currentSession.id,
      classId: class10.id,
      sectionId: secA.id,
      subjectId: mathSubject.id,
      teacherId: teacherStaff.id,
      title: 'Quadratic Equations: Exercise 4.1 & 4.2',
      description: 'Solve problems 1 to 15 from Chapter 4 in your practice notebook.',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due in 5 days
    },
  });

  // School Circular Notice
  await prisma.notice.create({
    data: {
      title: 'Welcome to Academic Session 2026-2027',
      content: 'We warmly welcome all students, parents, and faculty to the new academic session at Zustand Public School. All regular periods and lab schedules are now in active effect.',
      targetAudience: 'ALL',
      publishedById: adminUser.id,
    },
  });

  console.log('✓ All cross-panel links (Timetable, Homework, Attendance, Fee Invoice) initialized successfully.');
  console.log('========================================================================');
  console.log('🎉 Seed Completed Cleanly! Zero Fake Staff, Pure Real School Data.');
  console.log('========================================================================');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
