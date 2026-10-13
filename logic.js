(function(root){
  'use strict';
  const normalize = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, '').toLocaleLowerCase('ko');
  function cohortKey(grade, department = '') {
    if (![1, 2].includes(Number(grade))) return null;
    return String(2027 - Number(grade)) + (department ? '|' + department : '');
  }
  function evaluate(school, grade, department, course) {
    if (!school || !course || !cohortKey(grade)) return {status:'unselected'};
    if (school.unavailableGrades?.[String(grade)]) return {status:'unavailable',reason:school.unavailableGrades[String(grade)]};
    if (school.departments.length && !school.departments.includes(department)) return {status:'unselected'};
    const requestedYear = 2027 - Number(grade);
    const override = school.cohortOverrides?.[String(requestedYear)];
    const sourceYear = override?.sourceYear ?? requestedYear;
    const key = String(sourceYear) + (school.departments.length ? '|'+department : '');
    const cohort = school.cohorts[key];
    const basis = {requestedYear,sourceYear,notice:override?.notice||''};
    if (!cohort) return {status:'review',...basis,reason:school.missingNote||'해당 입학 연도와 학과의 교육과정 자료가 아직 등록되지 않았습니다.'};
    const matches = cohort.records.filter(record => normalize(record.name) === normalize(course));
    if (matches.length) return {status:'blocked',matches,cohort,...basis};
    if (cohort.complete && (!cohort.verifiedCourses || cohort.verifiedCourses.some(name=>normalize(name)===normalize(course)))) return {status:'absent',cohort,...basis};
    return {status:'review',cohort,...basis,reason:cohort.note};
  }
  const api={normalize,cohortKey,evaluate};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.CourseCheck=api;
})(typeof globalThis!=='undefined'?globalThis:this);
