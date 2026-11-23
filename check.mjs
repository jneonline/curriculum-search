import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {evaluate,normalize,cohortKey}=require('./dist/logic.js');
const data=JSON.parse(fs.readFileSync(new URL('./dist/data.json',import.meta.url),'utf8'));
const school=name=>data.schools.find(s=>s.name===name);
assert.equal(data.courses.length,37);
assert.equal(new Set(data.courses.map(normalize)).size,37);
assert.equal(data.courseDetails.length,37);
assert.equal(data.offering.year,2027);
assert.equal(data.offering.semester,1);
assert.ok(data.courses.includes('경제 수학'));
assert.ok(data.courses.includes('기업과 경영'));
assert.ok(data.courses.includes('고급 화학'));
assert.equal(data.courses[0],'간호의 기초');
assert.equal(data.courses.at(-1),'행성우주과학');
assert.ok(!data.courses.includes('보건'));
assert.equal(data.courses.filter(c=>c==='소프트웨어와 생활').length,1);
assert.equal(cohortKey(1),'2026');
assert.equal(cohortKey(2),'2025');
assert.equal(cohortKey(3),null);
assert.equal(evaluate(school('광남고등학교'),1,'','경제수학').status,'blocked');
assert.equal(evaluate(school('광남고등학교'),2,'','경제 수학').status,'blocked');
assert.equal(evaluate(school('광남고등학교'),1,'','인간과 철학').status,'blocked');
assert.equal(evaluate(school('광남고등학교'),2,'','인간과 철학').status,'absent');
assert.equal(evaluate(school('광남고등학교'),1,'','간호의 기초').status,'absent');
assert.equal(evaluate(school('광남고등학교'),3,'','보건').status,'unselected');
assert.equal(evaluate(school('전남외국어고등학교'),1,'','교육의 이해').status,'unselected');
assert.equal(evaluate(school('전남외국어고등학교'),1,'영어과','교육의 이해').status,'blocked');
assert.equal(evaluate(school('전남외국어고등학교'),1,'없는 학과','교육의 이해').status,'unselected');
assert.equal(evaluate(school('전남미래국제고등학교'),2,'스마트전기과','보건').status,'review');
assert.equal(evaluate(school('옥과고등학교'),1,'','보건').status,'review');
assert.equal(evaluate(school('중마고등학교'),1,'','도시의 미래 탐구').status,'blocked');
assert.equal(evaluate(school('중마고등학교'),2,'','도시의 미래 탐구').status,'absent');
assert.equal(normalize('미적분Ⅰ'),normalize('미적분 I'));
assert.notEqual(normalize('국제 경제'),normalize('경제'));
assert.equal(evaluate(null,1,'','보건').status,'unselected');
assert.equal(data.unassigned.length,0);
assert.ok(school('고흥고등학교').cohorts['2026']);
assert.ok(school('고흥고등학교').cohorts['2025']);
assert.equal(evaluate(school('광양백운고등학교'),1,'','보건').status,'review');
assert.equal(evaluate(school('광양백운고등학교'),2,'','보건').status,'review');
assert.equal(data.targetSchoolCount,103);
for(const name of ['조도고등학교']){
 const s=school(name);
 assert.equal(s.cohortOverrides['2026'].sourceYear,2025);
 for(const course of data.courses){
  const one=evaluate(s,1,'',course),two=evaluate(s,2,'',course);
  assert.equal(one.status,two.status);
  assert.equal(one.sourceYear,2025);
  assert.ok(one.notice.includes('반드시'));
  assert.ok(one.notice.includes('최신 편제표'));
  assert.equal(two.notice,'');
 }
}
for(const s of data.schools){
 for(const c of Object.values(s.cohorts)){
  assert.ok([2025,2026].includes(c.year));
  if(c.source.startsWith('sources/'))assert.ok(fs.existsSync(new URL('./dist/'+c.source,import.meta.url)));
  if(!c.complete)assert.notEqual(evaluate(s,2027-c.year,c.department,'테스트용 미등록 과목').status,'absent');
 }
}

assert.equal(evaluate(school('솔가람고등학교'),1,'','전자기와 양자').sourceYear,2026);
assert.equal(evaluate(school('솔가람고등학교'),1,'','전자기와 양자').notice,'');
const golf=school('함평골프고등학교'),songji=school('송지고등학교'),hanyoung=school('한영고등학교');
assert.deepEqual(golf.departments,[]);
assert.deepEqual(songji.departments,['보통과','경영정보과']);
assert.deepEqual(hanyoung.cohorts['2025'].records,hanyoung.cohorts['2026'].records);
for(const grade of [1,2]){
 assert.equal(evaluate(golf,grade,'','보건').status,'blocked');
 assert.equal(evaluate(songji,grade,'','보건').status,'unselected');
 assert.equal(evaluate(songji,grade,'보통과','보건').status,'blocked');
 assert.equal(evaluate(songji,grade,'경영정보과','보건').status,'review');
 assert.equal(evaluate(songji,grade,'경영정보과','인간과 심리').status,'blocked');
 assert.equal(evaluate(hanyoung,grade,'','보건').status,'blocked');
}
for(const course of data.courses){
 assert.equal(evaluate(hanyoung,1,'',course).status,evaluate(hanyoung,2,'',course).status);
}
console.log('Passed: data integrity, cohort mapping, department differences, shared curriculum and PDF sources.');
