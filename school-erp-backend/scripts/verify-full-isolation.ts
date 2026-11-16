const BASE_URL = 'http://localhost:4000/api/v1';

async function runVerification() {
  console.log('================================================================');
  console.log('ZUSTAND PUBLIC SCHOOL ERP — END-TO-END VERIFICATION SUITE');
  console.log('Testing Authentication, Data Isolation & Role Boundaries');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string, extra?: any) {
    if (condition) {
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc}`);
      if (extra) console.error('    Details:', JSON.stringify(extra).substring(0, 200));
      failed++;
    }
  }

  async function api(path: string, options: any = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const json = await res.json().catch(() => null);
    const data = json && json.data !== undefined ? json.data : json;
    return { status: res.status, ok: res.ok, data, raw: json };
  }

  // 1. ADMIN LOGIN
  console.log('--- TEST GROUP 1: School Admin Authentication ---');
  let adminToken = '';
  try {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: 'admin@zustand.edu',
        password: 'AdminSecure2026!@',
      }),
    });
    adminToken = res.data?.accessToken;
    assert(res.data?.user?.role === 'SCHOOL_ADMIN', 'Admin logged in with SCHOOL_ADMIN role', res.data);
    assert(!!adminToken, 'Admin JWT token received');
  } catch (err: any) {
    assert(false, `Admin login failed: ${err?.message}`);
  }

  // 2. TEACHER LOGIN
  console.log('\n--- TEST GROUP 2: Teacher Authentication & Assigned Classes ---');
  let teacherToken = '';
  try {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: 'teacher@zustand.edu',
        password: 'Teacher2026!@',
      }),
    });
    teacherToken = res.data?.accessToken;
    assert(res.data?.user?.role === 'TEACHER', 'Prof. Clara Higgins logged in with TEACHER role', res.data);
  } catch (err: any) {
    assert(false, `Teacher login failed: ${err?.message}`);
  }

  // 3. TEACHER ASSIGNED CLASSES & WORKSPACE ISOLATION
  let class10AId = '';
  let sec10AId = '';
  let otherClassId = '';
  let otherSecId = '';

  try {
    const myClassesRes = await api('/staff/teachers/my-classes', {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const myClasses = myClassesRes.data;
    assert(Array.isArray(myClasses) && myClasses.length > 0, `Teacher has ${myClasses?.length} assigned cohorts`, myClasses);
    const c10A = Array.isArray(myClasses) ? myClasses.find((c: any) => c.className.includes('10') && c.sectionName === 'A') : null;
    assert(!!c10A, 'Teacher assigned to Class 10-A');
    if (c10A) {
      class10AId = c10A.classId;
      sec10AId = c10A.sectionId;
    }

    // Access Class 10-A Workspace
    const wsRes = await api(`/staff/teachers/class-workspace/${class10AId}/${sec10AId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const studentCount = wsRes.data?.students?.length || wsRes.data?.roster?.length || 0;
    assert(wsRes.status === 200, 'Teacher successfully loaded Class 10-A Workspace');
    assert(studentCount > 0, `Workspace loaded ${studentCount} enrolled students`, wsRes.data);

    // Fetch an unassigned class using Admin
    const allClasses = await api('/classes', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const unassigned = allClasses.data?.find((c: any) => !c.name.includes('10'));
    if (unassigned && unassigned.sections?.length > 0) {
      otherClassId = unassigned.id;
      otherSecId = unassigned.sections[0].id;

      // Attempt to access unassigned class workspace
      const unauthWs = await api(`/staff/teachers/class-workspace/${otherClassId}/${otherSecId}`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert(unauthWs.status === 403, `403 Forbidden verified: Teacher blocked from unassigned class workspace (${unassigned.name})`);

      // Attempt to view attendance of unassigned class
      const unauthAtt = await api(`/attendance/class?classId=${otherClassId}&sectionId=${otherSecId}&date=2026-10-31`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert(unauthAtt.status === 403, '403 Forbidden verified: Teacher blocked from viewing unassigned class attendance');
    }
  } catch (err: any) {
    assert(false, `Teacher workspace test error: ${err?.message}`);
  }

  // 4. STUDENT AUTHENTICATION BY ADMISSION NUMBER & PROFILE ISOLATION
  console.log('\n--- TEST GROUP 3: Student Login & Personal Data Isolation ---');
  let aaravToken = '';
  let aaravStudentId = '';
  let priyaToken = '';
  let priyaStudentId = '';
  let shubhamToken = '';
  let shubhamStudentId = '';

  try {
    // Aarav Sharma (Class 10-A)
    const aaravRes = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: 'ADM-2026-1014',
        password: 'Student2026!@',
      }),
    });
    aaravToken = aaravRes.data?.accessToken;
    assert(aaravRes.data?.user?.role === 'STUDENT', 'Aarav logged in using Admission No ADM-2026-1014');

    // Priya Patel (Class 10-A)
    const priyaRes = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: 'ADM-2026-1015',
        password: 'Student2026!@',
      }),
    });
    priyaToken = priyaRes.data?.accessToken;
    assert(priyaRes.data?.user?.role === 'STUDENT', 'Priya logged in using Admission No ADM-2026-1015');

    // Shubham Maurya (Pre-Nursery-A)
    const shubhamRes = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: 'ADM-2026-6658',
        password: 'Student2026!@',
      }),
    });
    shubhamToken = shubhamRes.data?.accessToken;
    assert(shubhamRes.data?.user?.role === 'STUDENT', 'Shubham logged in using Admission No ADM-2026-6658');

    // Aarav calls /students/me
    const aaravMe = await api('/students/me', {
      headers: { Authorization: `Bearer ${aaravToken}` },
    });
    aaravStudentId = aaravMe.data?.id;
    assert(aaravMe.data?.admissionNo === 'ADM-2026-1014', 'Aarav /students/me returns personal profile');
    assert(aaravMe.data?.class?.name === 'Class 10', 'Aarav is correctly in Class 10');

    // Priya calls /students/me
    const priyaMe = await api('/students/me', {
      headers: { Authorization: `Bearer ${priyaToken}` },
    });
    priyaStudentId = priyaMe.data?.id;
    assert(priyaMe.data?.admissionNo === 'ADM-2026-1015', 'Priya /students/me returns personal profile');

    // Shubham calls /students/me
    const shubhamMe = await api('/students/me', {
      headers: { Authorization: `Bearer ${shubhamToken}` },
    });
    shubhamStudentId = shubhamMe.data?.id;
    assert(shubhamMe.data?.class?.name === 'Pre-Nursery', 'Shubham is isolated to Pre-Nursery');

    // Security Check: Aarav tries to access Priya's profile directly
    const crossProfile = await api(`/students/${priyaStudentId}`, {
      headers: { Authorization: `Bearer ${aaravToken}` },
    });
    assert(crossProfile.status === 403, '403 Forbidden verified: Student blocked from viewing peer profile');

    // Security Check: Aarav calls personal attendance
    const aaravAtt = await api('/attendance/my', {
      headers: { Authorization: `Bearer ${aaravToken}` },
    });
    assert(aaravAtt.data?.student?.admissionNo === 'ADM-2026-1014', 'Aarav /attendance/my returns verified attendance');

    // Security Check: Aarav tries to view Priya's attendance
    const crossAtt = await api(`/attendance/student/${priyaStudentId}`, {
      headers: { Authorization: `Bearer ${aaravToken}` },
    });
    assert(crossAtt.status === 403, '403 Forbidden verified: Student blocked from viewing peer attendance');

    // Timetable isolation
    const aaravTT = await api('/timetable/my-class', {
      headers: { Authorization: `Bearer ${aaravToken}` },
    });
    const aaravPeriods = Array.isArray(aaravTT.data) ? aaravTT.data : aaravTT.data?.periods || [];
    assert(aaravPeriods.length > 0, `Aarav timetable returns ${aaravPeriods.length} periods for Class 10-A`, aaravTT.data);

    const shubhamTT = await api('/timetable/my-class', {
      headers: { Authorization: `Bearer ${shubhamToken}` },
    });
    const shubhamPeriods = Array.isArray(shubhamTT.data) ? shubhamTT.data : shubhamTT.data?.periods || [];
    assert(shubhamTT.data?.class === 'Pre-Nursery', 'Shubham timetable queried independently for Pre-Nursery', shubhamTT.data);
  } catch (err: any) {
    assert(false, `Student test error: ${err?.message}`);
  }

  // 5. HOMEWORK SCOPE & INDIVIDUAL TARGETING ISOLATION
  console.log('\n--- TEST GROUP 4: Homework Class vs Individual Targeting ---');
  try {
    const aaravHw = await api('/homework', {
      headers: { Authorization: `Bearer ${aaravToken}` },
    });
    const priyaHw = await api('/homework', {
      headers: { Authorization: `Bearer ${priyaToken}` },
    });

    const aaravHasIndividual = aaravHw.data?.some((h: any) => h.targetType === 'INDIVIDUAL_STUDENT' && h.studentId === aaravStudentId);
    const priyaHasAaravIndividual = priyaHw.data?.some((h: any) => h.targetType === 'INDIVIDUAL_STUDENT' && h.studentId === aaravStudentId);

    assert(aaravHasIndividual, 'Aarav sees individual targeted homework assigned to him');
    assert(!priyaHasAaravIndividual, 'Priya DOES NOT see individual homework targeted to Aarav (Strict Isolation)');
  } catch (err: any) {
    assert(false, `Homework isolation error: ${err?.message}`);
  }

  // 6. PARENT PORTAL & CHILD LINKAGE ISOLATION
  console.log('\n--- TEST GROUP 5: Parent Portal & Child Boundary Verification ---');
  try {
    const parentRes = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: 'parent@zustand.edu',
        password: 'Parent2026!@',
      }),
    });
    const parentToken = parentRes.data?.accessToken;
    assert(parentRes.data?.user?.role === 'PARENT', 'Rajesh Sharma logged in with PARENT role', parentRes.data);

    // Get children
    const kidsRes = await api('/parents/my-children', {
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    const kidsList = Array.isArray(kidsRes.data) ? kidsRes.data : kidsRes.data?.children || [];
    assert(
      kidsList.length > 0 && kidsList.every((k: any) => k.admissionNo !== 'ADM-2026-6658'),
      `Parent sees ONLY linked children (${kidsList.map((k: any) => k.firstName).join(', ')}), strictly excluded from Shubham`,
      kidsRes.data
    );

    // Parent accesses Aarav's attendance
    const pAtt = await api(`/attendance/student/${aaravStudentId}`, {
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    assert(pAtt.status === 200, 'Parent successfully viewed linked child attendance');

    // Parent attempts to access unlinked student (Shubham Maurya)
    const crossKidAtt = await api(`/attendance/student/${shubhamStudentId}`, {
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    assert(crossKidAtt.status === 403, '403 Forbidden verified: Parent blocked from unlinked student attendance');
  } catch (err: any) {
    assert(false, `Parent test error: ${err?.message}`);
  }

  // 7. SUMMARY
  console.log('\n================================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch(console.error);
