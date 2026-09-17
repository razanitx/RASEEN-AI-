const modal=document.getElementById('authModal'),
signupFields=document.getElementById('signupFields'),
title=document.getElementById('modalTitle'),
sub=document.getElementById('modalSub'),
submit=document.getElementById('authSubmit'),
app=document.getElementById('app');
let authMode='login',wizardStep=1;
const $=id=>document.getElementById(id);

function getData(){try{return JSON.parse(localStorage.getItem('raseenData')||'{}')}catch{return {}}}
function saveData(d){localStorage.setItem('raseenData',JSON.stringify(d))}
function getAccount(){try{return JSON.parse(localStorage.getItem('raseenAccount')||'null')}catch{return null}}
function saveAccount(a){localStorage.setItem('raseenAccount',JSON.stringify(a))}
function isLoggedIn(){return sessionStorage.getItem('raseenSession')==='active'}
function setLoggedIn(v){
  if(v) sessionStorage.setItem('raseenSession','active');
  else sessionStorage.removeItem('raseenSession');
  updateLandingAuth();
}
function authMessage(text='',type='error'){
  const el=$('authMessage'); if(!el)return;
  el.textContent=text; el.className=text?`auth-message ${type}`:'auth-message hidden';
}
function updateLandingAuth(){
  const logged=isLoggedIn();
  $('guestAuth')?.classList.toggle('hidden',logged);
  $('memberAuth')?.classList.toggle('hidden',!logged);
  document.querySelectorAll('[data-open="signup"]').forEach(b=>b.classList.toggle('hidden',logged));
}
function openAuth(type){
  authMode=type;
  authMessage();
  modal.classList.add('show');
  const sign=type==='signup';
  signupFields.classList.toggle('hidden',!sign);
  title.textContent=sign?'إنشاء حساب':'تسجيل الدخول';
  sub.textContent=sign?'أنشئ حساب المنشأة ثم ابدأ أول تقييم':'مرحبًا بعودتك إلى رصين';
  submit.textContent=sign?'إنشاء الحساب والمتابعة':'تسجيل الدخول';
  $('companyNameInput').required=sign;
  $('authPassword').autocomplete=sign?'new-password':'current-password';
}
document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openAuth(b.dataset.open));
document.querySelector('.close').onclick=()=>modal.classList.remove('show');
modal.onclick=e=>{if(e.target===modal)modal.classList.remove('show')};

function requireAuth(target='dashboard'){
  if(!isLoggedIn()){
    app.classList.add('hidden');
    openAuth('login');
    authMessage('سجّل الدخول أولًا للوصول إلى لوحة التحكم.');
    return false;
  }
  return true;
}
function showApp(page='dashboard'){
  if(!requireAuth(page)) return;
  modal.classList.remove('show');
  app.classList.remove('hidden');
  const d=getData();
  $('companyTopName').textContent=d.company||'منشأتك';
  renderDashboard();
  showPage(page);
}
function logout(){
  setLoggedIn(false);
  app.classList.add('hidden');
  modal.classList.remove('show');
  authMessage();
  window.scrollTo({top:0,behavior:'smooth'});
}

$('authForm').onsubmit=e=>{
  e.preventDefault();
  authMessage();
  const email=$('authEmail').value.trim().toLowerCase();
  const password=$('authPassword').value;
  if(password.length<6){authMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');return}

  if(authMode==='signup'){
    const company=$('companyNameInput').value.trim();
    if(!company){authMessage('أدخل اسم المنشأة.');return}
    const existing=getAccount();
    if(existing && existing.email===email){
      authMessage('يوجد حساب بهذا البريد بالفعل. استخدم تسجيل الدخول.');
      return;
    }
    saveAccount({email,password,createdAt:new Date().toISOString()});
    const d={...getData(),company,sector:$('sectorInput').value,email};
    saveData(d);
    setLoggedIn(true);
    showApp('assessment');
    startWizard();
  }else{
    const account=getAccount();
    if(!account){
      authMessage('لا يوجد حساب مسجل على هذا المتصفح. أنشئ حسابًا أولًا.');
      return;
    }
    if(account.email!==email || account.password!==password){
      authMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      return;
    }
    setLoggedIn(true);
    const d=getData();
    showApp(d.hasResults?'dashboard':'assessment');
    if(!d.hasResults) startWizard();
  }
};

function showPage(id){
  if(!requireAuth(id))return;
  document.querySelectorAll('.app-page').forEach(p=>p.classList.add('hidden'));
  const p=$(id);if(p)p.classList.remove('hidden');
  document.querySelectorAll('.side-nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===id));
  const names={dashboard:'لوحة التحكم',assessment:'التقييم الذكي',analyzing:'تحليل رصين',alerts:'التنبيهات والمخاطر',action:'خطة العمل الذكية',regulations:'اللوائح',reports:'التقارير',settings:'الإعدادات'};
  $('pageTitle').textContent=names[id]||'رَصِين';
  renderFullPages();
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-page]');
  if(b){e.preventDefault();showPage(b.dataset.page)}
});

$('openDashboard')?.addEventListener('click',()=>showApp('dashboard'));
$('siteLogout')?.addEventListener('click',logout);
$('logoutBtn')?.addEventListener('click',logout);
$('settingsLogout')?.addEventListener('click',logout);
$('backSite').onclick=()=>{
  app.classList.add('hidden');
  updateLandingAuth();
  window.scrollTo({top:0,behavior:'smooth'});
};

// Public "demo" no longer bypasses authentication.
$('demoBtn').onclick=()=>{
  if(isLoggedIn()) showApp('dashboard');
  else{
    openAuth('login');
    authMessage('سجّل الدخول أولًا لاستعراض لوحة التحكم، أو أنشئ حسابًا جديدًا.');
  }
};

$('fixBtn').onclick=()=>showPage('action');
$('startAssessment').onclick=()=>{showPage('assessment');startWizard()};

function startWizard(){
  if(!requireAuth('assessment'))return;
  wizardStep=1;
  const d=getData();
  $('aCompany').value=d.company||'';
  $('aSector').value=d.sector||'تقني';
  updateWizard();
}
function updateWizard(){
  document.querySelectorAll('.wizard-step').forEach(x=>x.classList.toggle('hidden',+x.dataset.step!==wizardStep));
  $('progressText').textContent=`الخطوة ${wizardStep} من 4`;
  $('progressBar').style.width=(wizardStep*25)+'%';
  $('prevStep').classList.toggle('hidden',wizardStep===1);
  $('nextStep').classList.toggle('hidden',wizardStep===4);
  $('analyzeBtn').classList.toggle('hidden',wizardStep!==4);
}
$('nextStep').onclick=()=>{
  if(wizardStep===1&&!$('aCompany').value.trim()){alert('أدخل اسم المنشأة أولًا');return}
  wizardStep=Math.min(4,wizardStep+1);updateWizard()
};
$('prevStep').onclick=()=>{wizardStep=Math.max(1,wizardStep-1);updateWizard()};

function val(id){return +$(id).value}
function calculate(){
  const op=Math.min(100,Math.round((val('continuity')+val('dependency'))*2));
  const fin=Math.min(100,Math.round((val('cashflow')+val('overdue'))*2.1));
  const comp=Math.min(100,Math.round((val('licenses')+val('licenseDays')+val('privacy')+val('regUpdates'))*1.05));
  const overall=Math.round((op*.35)+(fin*.25)+(comp*.40));
  const score=Math.max(35,100-overall);
  let critical=0,medium=0,alerts=[];
  if(val('licenseDays')>=30||val('licenses')>=32){critical++;alerts.push('license')}
  else if(val('licenseDays')>=18||val('licenses')>=15){medium++;alerts.push('license')}
  if(val('privacy')>=28||val('regUpdates')>=26){medium++;alerts.push('privacy')}
  if(op>=55){medium++;alerts.push('operations')}
  if(fin>=55){medium++;alerts.push('finance')}
  return {opRisk:op,finRisk:fin,compRisk:comp,score,critical,medium,alerts}
}
$('assessmentForm').onsubmit=e=>{
  e.preventDefault();
  if(!requireAuth('assessment'))return;
  const r=calculate(),d={...getData(),company:$('aCompany').value.trim(),sector:$('aSector').value,employees:$('employees').value,companyAge:$('companyAge').value,...r,hasResults:true,updated:new Date().toISOString()};
  saveData(d);$('companyTopName').textContent=d.company;runAnalysis()
};
function runAnalysis(){
  if(!requireAuth('analyzing'))return;
  showPage('analyzing');
  ['ai1','ai2','ai3','ai4'].forEach(id=>$(id).textContent=$(id).textContent.replace('✓','○'));
  $('analysisBar').style.width='0%';
  const stages=[['قراءة ملف المنشأة','ai1',25],['تحليل المؤشرات المالية والتشغيلية','ai2',50],['مطابقة مؤشرات الامتثال','ai3',75],['توليد النتائج والتوصيات','ai4',100]];
  stages.forEach((s,i)=>setTimeout(()=>{
    if(!isLoggedIn())return;
    $('analysisMessage').textContent=s[0];
    $(s[1]).textContent='✓ '+$(s[1]).textContent.replace(/^○ |^✓ /,'');
    $('analysisBar').style.width=s[2]+'%';
    if(i===3)setTimeout(()=>{if(isLoggedIn()){renderDashboard();renderAlerts();showPage('dashboard')}},700)
  },700*(i+1)))
}

function renderDashboard(){
  const d=getData(),has=!!d.hasResults;
  $('emptyDashboard').classList.toggle('hidden',has);
  $('resultsDashboard').classList.toggle('hidden',!has);
  if(!has){renderFullPages();return}
  $('welcomeCompany').textContent=d.company||'منشأتك';
  $('scoreValue').textContent=d.score+'%';
  const label=d.score>=85?'ممتاز':d.score>=70?'جيد':d.score>=55?'يحتاج تحسين':'مرتفع المخاطر';
  $('scoreLabel').textContent=label;
  $('scoreRing').style.background=`conic-gradient(var(--blue) 0 ${d.score}%,#e8edf5 ${d.score}%)`;
  $('criticalCount').textContent=d.critical;
  $('mediumCount').textContent=d.medium;
  [['op',d.opRisk],['fin',d.finRisk],['comp',d.compRisk]].forEach(([k,v])=>{$(k+'Bar').style.width=v+'%';$(k+'Val').textContent=v+'%'});
  let top='الوضع العام مستقر',txt='لم يرصد رصين مخاطر عالية في الإجابات الحالية. استمر في تحديث بيانات المنشأة دوريًا.';
  if(d.critical){top='يوجد إجراء عاجل يحتاج انتباهك';txt='تم رصد مؤشر امتثال عالي الأولوية. راجع التنبيهات وابدأ الخطة التصحيحية قبل انتهاء المهلة.'}
  else if(d.medium){top='توجد نقاط تحتاج مراجعة';txt='رصد رصين بعض الفجوات المتوسطة. معالجتها مبكرًا تساعد على رفع مؤشر الصحة والامتثال.'}
  $('insightTitle').textContent=top;$('insightText').textContent=txt;
  if($('lastUpdated'))$('lastUpdated').textContent='آخر تحديث: '+(d.updated?new Date(d.updated).toLocaleString('ar-SA'):'الآن');
  renderAlerts();renderFullPages();
}
function renderAlerts(){
  const d=getData();if(!d.hasResults)return;
  const cards=$('alerts').querySelectorAll('.alert-card');
  cards[0].classList.toggle('hidden',!d.alerts?.includes('license'));
  cards[1].classList.toggle('hidden',!d.alerts?.includes('privacy'));
  const badge=$('alerts').querySelector('.badge');
  badge.textContent=(d.critical+d.medium)+' تنبيهات نشطة';
  if(!(d.alerts||[]).includes('license')&&!(d.alerts||[]).includes('privacy'))badge.textContent='لا توجد تنبيهات تنظيمية نشطة'
}
function renderFullPages(){
  const d=getData(),has=!!d.hasResults;
  const navBadge=document.querySelector('.side-nav button[data-page="alerts"] i');
  if(navBadge)navBadge.textContent=has?(d.critical+d.medium):0;
  if($('privacyRegScore'))$('privacyRegScore').textContent=has?(d.compRisk+'% خطر'):'--';
  if($('licenseRegStatus'))$('licenseRegStatus').textContent=has&&d.alerts?.includes('license')?'يتطلب متابعة':'مستقر';
  if($('regInsight'))$('regInsight').textContent=!has?'أكمل التقييم لتخصيص متطلبات الامتثال.':d.compRisk>=50?'توجد فجوات امتثال تحتاج إلى أولوية في المراجعة. ابدأ بالتنبيهات التنظيمية النشطة.':'مؤشرات الامتثال الحالية مستقرة نسبيًا، مع الاستمرار في المراجعة الدورية.';
  $('reportEmpty')?.classList.toggle('hidden',has);
  $('reportContent')?.classList.toggle('hidden',!has);
  if(has){
    $('reportScore').textContent=d.score+'%';$('reportOp').textContent=d.opRisk+'%';$('reportFin').textContent=d.finRisk+'%';$('reportComp').textContent=d.compRisk+'%';
    $('reportCompany').textContent=d.company||'--';$('reportSector').textContent=d.sector||'--';$('reportAlerts').textContent=(d.critical+d.medium)+' نشطة';
    $('reportDate').textContent=d.updated?new Date(d.updated).toLocaleDateString('ar-SA'):'الآن';
    $('reportSummary').textContent=d.critical?'أظهر التحليل وجود خطر عالي الأولوية يحتاج إلى إجراء تصحيحي قريب، مع ضرورة متابعة بقية مؤشرات المخاطر والامتثال.':d.medium?'الوضع العام للمنشأة جيد، مع وجود نقاط متوسطة الأولوية يوصى بمعالجتها مبكرًا لرفع مستوى الجاهزية.':'الوضع العام مستقر ولم يرصد التقييم الحالي مخاطر مرتفعة. يوصى بإعادة التقييم عند حدوث تغييرات جوهرية.'
  }
  if($('sCompany')){$('sCompany').value=d.company||'';$('sSector').value=d.sector||'تقني';$('sEmail').value=d.email||getAccount()?.email||''}
}
$('settingsForm')?.addEventListener('submit',e=>{
  e.preventDefault();if(!requireAuth('settings'))return;
  const d=getData();d.company=$('sCompany').value.trim();d.sector=$('sSector').value;d.email=$('sEmail').value.trim();saveData(d);
  $('companyTopName').textContent=d.company||'منشأتك';$('saveMsg').textContent='✓ تم حفظ التغييرات';setTimeout(()=>$('saveMsg').textContent='',1800);renderDashboard()
});
$('clearResults')?.addEventListener('click',()=>{
  if(!requireAuth('settings'))return;
  if(confirm('هل تريد مسح نتائج التقييم الحالية؟')){
    const d=getData();['hasResults','score','critical','medium','opRisk','finRisk','compRisk','alerts','updated'].forEach(k=>delete d[k]);saveData(d);renderDashboard();showPage('dashboard')
  }
});
$('printReport')?.addEventListener('click',()=>{
  if(!requireAuth('reports'))return;
  if(getData().hasResults)window.print();else alert('أكمل التقييم أولًا لإنشاء التقرير')
});

// Initial state: never open the private app unless a valid active session exists.
app.classList.add('hidden');
updateLandingAuth();
if(isLoggedIn()){
  const d=getData();
  $('companyTopName').textContent=d.company||'منشأتك';
}
renderFullPages();
