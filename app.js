'use strict';
let data;
const $=id=>document.getElementById(id);
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function school(){return data?.schools.find(s=>s.id===$('school').value);}
function currentResult(course=$('course').value){return CourseCheck.evaluate(school(),$('grade').value,$('department').value,course);}
function person(){const s=school();return s?`${s.name} · 현재 ${$('grade').value}학년${$('department').value?' · '+$('department').value:''}`:'';}
function updateSchool(){const s=school();$('department-field').hidden=!s?.departments.length;$('department').innerHTML='<option value="">학과를 선택하세요</option>'+(s?.departments.map(d=>`<option>${escapeHTML(d)}</option>`).join('')||'');$('department').required=!!s?.departments.length;$('course-step').textContent=s?.departments.length?'4':'3';refresh();}
function refresh(){
 const grade=Number($('grade').value),year=2027-grade;
 $('cohort-hint').textContent=`2027학년도에는 ${grade+1}학년입니다.`;
 const override=school()?.cohortOverrides?.[String(year)];
 $('result-year').textContent=school()?(override?`${override.sourceYear} 입학생 자료로 대체`:`${year} 입학생 · 3개년 전체`):'3개년 전체 비교';
 renderResult();renderCourses();
}
function renderResult(){
 const r=currentResult(),course=$('course').value;
 if(r.status==='unavailable'){$('result').innerHTML=`<div class="empty"><h3>해당 학년 학생 없음</h3><p>${escapeHTML(r.reason)}</p></div>`;return;}
 if(r.status==='unselected'){$('result').innerHTML=`<div class="empty"><div class="empty-icon" aria-hidden="true">≡</div><h3>${school()?.departments.length&&!$('department').value?'소속 학과를 선택하세요.':'학교와 강좌를 선택하세요.'}</h3><p>입학 연도에 맞는 교육과정에서<br>1·2·3학년 전체 편성 과목을 확인합니다.</p><span class="empty-caption">이미 배운 과목과 앞으로 배울 과목을 모두 포함</span></div>`;return;}
 const labels={blocked:'편성 확인 · 신청 불가',absent:'동일 과목 편성 없음',review:'교육과정 자료 확인 필요'};
 const descriptions={blocked:'학교의 3개년 교육과정에 같은 과목이 편성되어 있습니다.',absent:'제공된 입학 연도별 편제표의 과목 목록에서 같은 과목이 검색되지 않았습니다. 다른 신청 요건도 확인하세요.',review:r.reason||'전체 편제표 확인이 필요합니다. 이 결과로 신청 가능 여부를 확정할 수 없습니다.'};
 let evidence='';
 if(r.matches){const terms=[...new Set(r.matches.flatMap(rec=>rec.terms||[]))].sort();evidence=`<div class="evidence"><h4>편성 학년·학기</h4><p><strong>${terms.length?escapeHTML(terms.join(' · '))+' 편성':'편성 시기 확인 필요'}</strong></p>${sourceCitation(r.cohort)}</div>`;}
 else if(r.cohort){evidence=`<div class="evidence"><h4>${r.status==='absent'?'비교한 교육과정':'자료 상태'}</h4><p>${escapeHTML(r.cohort.year)}학년도 입학생의 1·2·3학년 편제표${r.cohort.department?' · '+escapeHTML(r.cohort.department):''}</p><p>${escapeHTML(r.cohort.note)}</p>${sourceCitation(r.cohort)}</div>`;}
 $('result').innerHTML=`<p class="result-person">${escapeHTML(person())}</p>${r.notice?`<div class="cohort-notice"><strong>반드시 최신 편제표를 확인하세요.</strong><p>${escapeHTML(r.notice)}</p></div>`:''}<span class="result-tag ${r.status}">${labels[r.status]}</span><h3 class="result-course">${escapeHTML(course)}</h3><p class="result-description">${escapeHTML(descriptions[r.status])}</p>${evidence}<p class="result-footnote">2026학년도 정보공시 자료를 바탕으로 한 결과입니다. 실제 신청 전에 최신 편제표와 운영 기준을 확인하세요.</p>`;
}
function sourceCitation(cohort){return cohort?`<p class="source-citation">출처 · 2026학년도 정보공시 학교 교육과정 편제표 · ${escapeHTML(cohort.year)}학년도 입학생 기준</p>`:' ';}
function renderCourses(){if(!data)return;const query=CourseCheck.normalize($('search').value);const filtered=data.courses.filter(c=>CourseCheck.normalize(c).includes(query));let ready=school()&&(!school().departments.length||$('department').value);$('legend').hidden=!ready;$('list-hint').textContent=ready?`${person()} · 22개 강좌를 해당 입학 연도의 3개년 교육과정과 비교합니다.`:'학교를 선택하면 22개 강좌의 편성 여부를 한눈에 볼 수 있습니다.';
 $('course-count').textContent=filtered.length===data.courses.length?String(data.courses.length):`${filtered.length} / ${data.courses.length}`;
 $('course-list').innerHTML=filtered.map(c=>{const r=currentResult(c);const terms=[...new Set((r.matches||[]).flatMap(rec=>rec.terms||[]))].sort();const labels={blocked:'신청 불가',absent:'편성 없음',review:'확인 필요',unselected:'선택하여 확인',unavailable:'해당 학년 없음'};return `<button type="button" class="course-card${c===$('course').value?' active':''}" data-course="${escapeHTML(c)}" aria-pressed="${c===$('course').value}"><span class="course-name">${escapeHTML(c)}${r.status==='blocked'?`<small class="course-terms">${terms.length?escapeHTML(terms.join(' · '))+' 편성':'편성 시기 확인 필요'}</small>`:''}</span><span class="course-status ${r.status}">${labels[r.status]}</span></button>`;}).join('');$('no-courses').hidden=!!filtered.length;
}
async function init(){try{const response=await fetch('./data.json',{cache:'no-store'});if(!response.ok)throw new Error('교육과정 자료를 불러오지 못했습니다.');data=await response.json();$('school').innerHTML='<option value="">학교를 선택하세요</option>'+data.schools.map(s=>`<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('');$('course').innerHTML=data.courses.map(c=>`<option>${escapeHTML(c)}</option>`).join('');$('course').value='보건';for(const id of ['school','course','check-button'])$(id).disabled=false;refresh();}catch(error){$('load-error').hidden=false;$('load-error').textContent='자료를 불러오지 못했습니다. 페이지를 새로고침해 주세요.';console.error(error);}}
$('school').addEventListener('change',updateSchool);$('grade').addEventListener('change',()=>{if(school()?.departments.length)$('department').value='';refresh();});$('department').addEventListener('change',refresh);$('course').addEventListener('change',refresh);$('search').addEventListener('input',renderCourses);$('check-form').addEventListener('submit',event=>{event.preventDefault();refresh();if(window.innerWidth<761)$('result-heading').scrollIntoView({behavior:'smooth',block:'start'});});$('course-list').addEventListener('click',event=>{const button=event.target.closest('[data-course]');if(!button)return;$('course').value=button.dataset.course;refresh();});init();
