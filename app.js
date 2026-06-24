/* ═══════════════════════════════════════════════════════════════════════════
   Kikō PMO OS — v4.1a (static / vanilla JS)
   Working memory layer · Import › Merge › Export · never overwrite
   Features: Capture · Import · Merge/Convert · Portfolio · Daily PMO · Export
   No framework · No build · localStorage persistence
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const LS_KEY = "kiko_pmo_v41a_nodes";
  const LS_ROLE = "kiko_pmo_v41a_role";
  const LS_SYNC_URL = "kiko_pmo_sync_url";       // Apps Script Web App URL (this device)
  const LS_SYNC_META = "kiko_pmo_sync_meta";     // {at, device} last sync info
  const LS_DEVICE = "kiko_pmo_device";           // friendly device name (iPhone / Laptop…)

  /* ─── bilingual labels ─────────────────────────────────────────────────── */
  const L = {
    capture:"Capture 擷取", portfolio:"Account 對象", project:"Project 專案",
    branch:"Branch 工項", work:"Work 待辦",
    inbox:"Inbox 收件匣", incubator:"Incubator 孵化", active:"Active 進行中",
    frozen:"Frozen 凍結", archived:"Archived 封存",
    ready:"Ready 就緒", developing:"Developing 進行", blocked:"Blocked 受阻", complete:"Complete 完成",
    todo:"To-do 待辦", doing:"Doing 進行", done:"Done 完成",
    deliver:"Deliver 交付", build:"Build 建構", explore:"Explore 探索",
    manual:"Manual 手動", meeting:"Meeting 會議", import:"Import 匯入",
    screenshot:"Screenshot 截圖", chat:"Chat 對話",
  };
  const lbl = k => L[k] || k;
  const lblEn = k => (L[k] || k).split(" ")[0];
  const lblZh = k => { const p=(L[k]||k).split(" "); return p[1]||p[0]; };

  /* ─── config (colors mirror the wabi-sabi tokens) ──────────────────────── */
  const TYPE_CFG = {
    capture:  { c:"var(--inkLight)", bg:"var(--bgMuted)",  i:"✱" },
    portfolio:{ c:"var(--moss)",     bg:"var(--mossBg)",   i:"◉" },
    project:  { c:"var(--slate)",    bg:"var(--slateBg)",  i:"◆" },
    branch:   { c:"var(--bamboo)",   bg:"var(--bambooBg)", i:"❯" },
    work:     { c:"var(--clay)",     bg:"var(--clayBg)",   i:"▪" },
  };
  const PORTFOLIO_CFG = {
    inbox:     { c:"var(--slate)",    bg:"var(--slateBg)",  i:"⌂" },
    incubator: { c:"var(--bamboo)",   bg:"var(--bambooBg)", i:"❍" },
    active:    { c:"var(--moss)",     bg:"var(--mossBg)",   i:"●" },
    frozen:    { c:"var(--slate)",    bg:"var(--slateBg)",  i:"❄" },
    archived:  { c:"var(--inkLight)", bg:"var(--bgMuted)",  i:"▢" },
  };
  const STAGE_CFG = {
    ready:      { c:"var(--moss)",   bg:"var(--mossBg)",   i:"○" },
    developing: { c:"var(--bamboo)", bg:"var(--bambooBg)", i:"◑" },
    blocked:    { c:"var(--clay)",   bg:"var(--clayBg)",   i:"◈" },
    complete:   { c:"var(--moss)",   bg:"var(--mossBg)",   i:"✓" },
  };
  const WORK_CFG = {
    todo:  { c:"var(--inkLight)", bg:"var(--bgMuted)",  i:"☐" },
    doing: { c:"var(--bamboo)",   bg:"var(--bambooBg)", i:"◐" },
    done:  { c:"var(--moss)",     bg:"var(--mossBg)",   i:"☑" },
  };
  const WIP_LIMITS = { deliver:2, build:1, explore:1 };
  const ALLOWED_PARENT = {
    portfolio:[null], project:["portfolio"], branch:["project"], work:["branch"], capture:[null]
  };

  /* ─── seed (imported via gate, not auto-applied) ───────────────────────── */
  const SEED_NODES = [
  {
    "id": "PF001",
    "type": "portfolio",
    "parentType": null,
    "parentId": null,
    "title": "農業部業界循環計畫",
    "summary": "育苗盆耐用度/環境impact/栽種驗證提案",
    "tags": [
      "proposal",
      "塑膠中心",
      "林保署"
    ],
    "lastProgress": "2026-06-19",
    "progressSignal": "manual",
    "lastUpdated": "2026-06-19",
    "logs": [],
    "attachments": [],
    "portfolioState": "active",
    "projectMode": "deliver"
  },
  {
    "id": "PR001",
    "type": "project",
    "parentType": "portfolio",
    "parentId": "PF001",
    "title": "計畫書完成",
    "summary": "完成提案交付",
    "tags": [
      "proposal"
    ],
    "lastProgress": "2026-06-19",
    "progressSignal": "manual",
    "lastUpdated": "2026-06-19",
    "logs": [],
    "attachments": [],
    "executionStage": "developing",
    "firstSuccessEvent": "送出提案",
    "deadline": "2026-06-30",
    "stakeholders": []
  },
  {
    "id": "BR001",
    "type": "branch",
    "parentType": "project",
    "parentId": "PR001",
    "title": "耐用度與環境驗證",
    "summary": "整理資料給夥伴",
    "tags": [
      "validation"
    ],
    "lastProgress": "2026-06-19",
    "progressSignal": "manual",
    "lastUpdated": "2026-06-19",
    "logs": [],
    "attachments": [],
    "executionStage": "ready",
    "firstSuccessEvent": "塑膠中心收到資料",
    "deadline": null,
    "channel": "partner"
  },
  {
    "id": "WK001",
    "type": "work",
    "parentType": "branch",
    "parentId": "BR001",
    "title": "整理資料包",
    "summary": "提供試驗與架構",
    "tags": [
      "next"
    ],
    "lastProgress": "2026-06-19",
    "progressSignal": "manual",
    "lastUpdated": "2026-06-19",
    "logs": [],
    "attachments": [],
    "workStatus": "todo",
    "owner": "Marcy",
    "firstSuccessEvent": "資料寄出",
    "deadline": "2026-06-20"
  },
  {
    "id": "PF002",
    "type": "portfolio",
    "parentType": null,
    "parentId": null,
    "title": "KIKO 商品上架",
    "summary": "官網與PINKOI首波上架",
    "tags": [
      "commerce"
    ],
    "lastProgress": "2026-06-19",
    "progressSignal": "manual",
    "lastUpdated": "2026-06-19",
    "logs": [],
    "attachments": [],
    "portfolioState": "active",
    "projectMode": "deliver"
  },
  {
    "id": "PR002",
    "type": "project",
    "parentType": "portfolio",
    "parentId": "PF002",
    "title": "首波SKU上架",
    "summary": "RP6058/DP1086/RB4086/RB575/RB740/CT4003/RB4739/RB6239",
    "tags": [
      "launch"
    ],
    "lastProgress": "2026-06-19",
    "progressSignal": "manual",
    "lastUpdated": "2026-06-19",
    "logs": [],
    "attachments": [],
    "executionStage": "ready",
    "firstSuccessEvent": "至少1品完成上架",
    "deadline": null,
    "stakeholders": []
  },
  {
    "id": "BR002",
    "type": "branch",
    "parentType": "project",
    "parentId": "PR002",
    "title": "商品拍攝與吊卡",
    "summary": "CT4003吊卡未完成",
    "tags": [
      "media"
    ],
    "lastProgress": "2026-06-19",
    "progressSignal": "manual",
    "lastUpdated": "2026-06-19",
    "logs": [],
    "attachments": [],
    "executionStage": "ready",
    "firstSuccessEvent": "完成商品照",
    "deadline": null,
    "channel": "brand"
  },
  {
    "id": "WK002",
    "type": "work",
    "parentType": "branch",
    "parentId": "BR002",
    "title": "拍攝與確認",
    "summary": "",
    "tags": [
      "urgent"
    ],
    "lastProgress": "2026-06-19",
    "progressSignal": "manual",
    "lastUpdated": "2026-06-19",
    "logs": [],
    "attachments": [],
    "workStatus": "todo",
    "owner": "Marcy",
    "firstSuccessEvent": "完成CT4003首版",
    "deadline": null
  },
  {
    "id": "PF003",
    "type": "portfolio",
    "parentType": null,
    "parentId": null,
    "title": "嘉藥USR樣品",
    "summary": "雷雕樣品供包裝使用",
    "tags": [
      "usr"
    ],
    "lastProgress": "2026-06-19",
    "progressSignal": "manual",
    "lastUpdated": "2026-06-19",
    "logs": [],
    "attachments": [],
    "portfolioState": "active",
    "projectMode": "build"
  },
  {
    "id": "PR003",
    "type": "project",
    "parentType": "portfolio",
    "parentId": "PF003",
    "title": "雷雕樣品輸出",
    "summary": "設備到位待試作",
    "tags": [
      "laser"
    ],
    "lastProgress": "2026-06-19",
    "progressSignal": "manual",
    "lastUpdated": "2026-06-19",
    "logs": [],
    "attachments": [],
    "executionStage": "developing",
    "firstSuccessEvent": "第一片成功輸出",
    "deadline": null,
    "stakeholders": []
  },
  {
    "id": "BR003",
    "type": "branch",
    "parentType": "project",
    "parentId": "PR003",
    "title": "雷雕設定",
    "summary": "軟體setup與匯入設計",
    "tags": [
      "setup"
    ],
    "lastProgress": "2026-06-19",
    "progressSignal": "manual",
    "lastUpdated": "2026-06-19",
    "logs": [],
    "attachments": [],
    "executionStage": "ready",
    "firstSuccessEvent": "可正常出樣",
    "deadline": null,
    "channel": "lab"
  },
  {
    "id": "WK003",
    "type": "work",
    "parentType": "branch",
    "parentId": "BR003",
    "title": "輸出第一片並拍照",
    "summary": "",
    "tags": [
      "next"
    ],
    "lastProgress": "2026-06-19",
    "progressSignal": "manual",
    "lastUpdated": "2026-06-19",
    "logs": [],
    "attachments": [],
    "workStatus": "todo",
    "owner": "Marcy",
    "firstSuccessEvent": "取得樣品照片",
    "deadline": null
  },
  {
    "id": "PF004",
    "type": "portfolio",
    "parentType": null,
    "parentId": null,
    "title": "工廠 Workflow OS",
    "summary": "流程與自動化整理",
    "tags": [
      "system"
    ],
    "lastProgress": "2026-06-19",
    "progressSignal": "manual",
    "lastUpdated": "2026-06-19",
    "logs": [],
    "attachments": [],
    "portfolioState": "incubator",
    "projectMode": "build"
  },
  {
    "id": "PR004",
    "type": "project",
    "parentType": "portfolio",
    "parentId": "PF004",
    "title": "流程盤點",
    "summary": "先定義流程不做App",
    "tags": [
      "ops"
    ],
    "lastProgress": "2026-06-19",
    "progressSignal": "manual",
    "lastUpdated": "2026-06-19",
    "logs": [],
    "attachments": [],
    "executionStage": "ready",
    "firstSuccessEvent": "流程圖完成",
    "deadline": null,
    "stakeholders": []
  },
  {
    "id": "PF005",
    "type": "portfolio",
    "parentType": null,
    "parentId": null,
    "title": "NFC 商務卡 Demo",
    "summary": "暫停",
    "tags": [
      "freeze"
    ],
    "lastProgress": "2026-06-19",
    "progressSignal": "manual",
    "lastUpdated": "2026-06-19",
    "logs": [],
    "attachments": [],
    "portfolioState": "frozen",
    "projectMode": "explore"
  },
  {
    "id": "PF006",
    "type": "portfolio",
    "parentType": null,
    "parentId": null,
    "title": "網站 SEO",
    "summary": "暫停",
    "tags": [
      "freeze"
    ],
    "lastProgress": "2026-06-19",
    "progressSignal": "manual",
    "lastUpdated": "2026-06-19",
    "logs": [],
    "attachments": [],
    "portfolioState": "frozen",
    "projectMode": "build"
  }
];

  /* ─── helpers ──────────────────────────────────────────────────────────── */
  const todayStr = () => new Date().toISOString().slice(0,10);
  const daysSince = d => d ? Math.floor((Date.now()-new Date(d))/86400000) : 0;
  const fmt = d => { if(!d) return "—"; const x=new Date(d);
    return x.getFullYear()+"/"+String(x.getMonth()+1).padStart(2,"0")+"/"+String(x.getDate()).padStart(2,"0"); };
  const uid = p => p+"_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,6);
  const esc = s => String(s==null?"":s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

  const childrenOf = (ns,id) => ns.filter(n=>n.parentId===id && !n.mergeIntoId);
  const byId = (ns,id) => ns.find(n=>n.id===id);
  const isStale = n => {
    if (["portfolio","capture"].includes(n.type)) return false;
    if (n.executionStage==="complete"||n.workStatus==="done") return false;
    return daysSince(n.lastProgress) > 7;
  };
  function wipCounts(ns){
    const c={deliver:0,build:0,explore:0};
    ns.filter(n=>n.type==="portfolio"&&n.portfolioState==="active")
      .forEach(n=>{ if(c[n.projectMode]!==undefined) c[n.projectMode]++; });
    return c;
  }
  function rootPortfolio(ns,n){ let cur=n,g=0; while(cur&&cur.parentId&&g++<6){ cur=byId(ns,cur.parentId); } return cur; }

  // ── friendly (non-architecture) labels for default mode ──────────────────────
  const FRIENDLY = { portfolio:"對象 Account", project:"專案 Project", branch:"工項 Branch", work:"待辦 Work" };
  function typeWord(t){ return S.advanced ? lbl(t) : (FRIENDLY[t]||t); }

  // ── hierarchy code: portfolio=letter(A,B,…), project=A.1, branch=A.1.a, work=A.1.a.i ──
  const LETTERS="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const ROMAN=["i","ii","iii","iv","v","vi","vii","viii","ix","x","xi","xii"];
  function buildCodes(ns){
    const code={};
    const ports=ns.filter(n=>n.type==="portfolio"&&!n.mergeIntoId);
    ports.forEach((p,pi)=>{
      code[p.id]=LETTERS[pi]||("P"+(pi+1));
      childrenOf(ns,p.id).filter(n=>n.type==="project").forEach((pr,ji)=>{
        code[pr.id]=code[p.id]+"."+(ji+1);
        childrenOf(ns,pr.id).filter(n=>n.type==="branch").forEach((br,bi)=>{
          code[br.id]=code[pr.id]+"."+(LETTERS[bi]||("b"+bi)).toLowerCase();
          childrenOf(ns,br.id).filter(n=>n.type==="work").forEach((wk,wi)=>{
            code[wk.id]=code[br.id]+"."+(ROMAN[wi]||("w"+wi));
          });
        });
      });
    });
    return code;
  }

  /* ─── state ────────────────────────────────────────────────────────────── */
  const S = {
    role:null,          // 'bizdev' | 'factory'
    nodes:null,         // null until seed gate resolved
    view:"daily",
    selectedId:null,
    detailTab:"info",
    pfFilter:"active",
    expanded:{},        // tree expansion in portfolio
    importMode:"preview",
    importRaw:"",
    importReport:null,
    mdPreview:false,
    advanced:false,     // UX: hide architecture terms by default
    moveFor:null,       // node id being re-parented (移動到…)
    moreFor:null,       // branch id under which 做更多 adds a 待辦
    moreTitle:"", moreDday:"",
    noteDraft:"",       // draft text for adding a note on detail
    highlightId:null,   // work to highlight after Daily→Project deep link
    editLogId:null, editLogMsg:"", editLogDate:"",  // editing a log entry
    editTitleId:null,  // node id whose title is being inline-edited
    treeEditId:null,   // node id being inline-edited inside 專案樹狀圖
    // ── Google Sheets sync (via Apps Script Web App) ──
    syncUrl:"",         // user-pasted Web App URL
    syncDevice:"",      // this device's friendly name
    syncStatus:"idle",  // idle | syncing | ok | error
    syncMeta:null,      // { at:ISO, device:"iPhone" }
    syncMsg:"",         // last status message
    dirty:false,        // unsynced local changes exist
    settingsUrlDraft:"",// settings page input buffer
    settingsDevDraft:"",
  };

  // ── tag-encoded metadata (schema unchanged: stored as special tags) ──────────
  // case number  → tag "案號:XXX"     D-DAY → tag "DDAY:YYYY-MM-DD"   pin → tag "PIN"
  const TAG_CASE = "案號:", TAG_DDAY = "DDAY:", TAG_PIN = "PIN", TAG_LINK = "連結:";
  function getCaseNo(n){ const t=(n.tags||[]).find(x=>x.indexOf(TAG_CASE)===0); return t?t.slice(TAG_CASE.length):""; }
  function getDday(n){ const t=(n.tags||[]).find(x=>x.indexOf(TAG_DDAY)===0); return t?t.slice(TAG_DDAY.length):""; }
  function getLink(n){ const t=(n.tags||[]).find(x=>x.indexOf(TAG_LINK)===0); return t?t.slice(TAG_LINK.length):""; }
  const TAG_NOTE = "備註:";
  function getNotes(n){ return (n.tags||[]).filter(x=>x.indexOf(TAG_NOTE)===0).map(x=>x.slice(TAG_NOTE.length)); }
  // linkify URLs inside a note string → clickable anchors (escaped elsewhere)
  function linkifyNote(text){
    const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    return esc(text).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" class="wlink" style="color:var(--slate);text-decoration:underline">$1</a>');
  }
  function isPinned(n){ return (n.tags||[]).indexOf(TAG_PIN)>-1; }
  function visibleTags(n){ return (n.tags||[]).filter(x=>x.indexOf(TAG_CASE)!==0&&x.indexOf(TAG_DDAY)!==0&&x.indexOf(TAG_LINK)!==0&&x.indexOf("備註:")!==0&&x!==TAG_PIN&&x!=="⏸延後"); }
  function setTagKV(n, prefix, value){
    let tags=(n.tags||[]).filter(x=>x.indexOf(prefix)!==0);
    if(value) tags.push(prefix+value);
    return tags;
  }
  function togglePin(n){
    const tags=(n.tags||[]).slice(); const i=tags.indexOf(TAG_PIN);
    if(i>-1) tags.splice(i,1); else tags.push(TAG_PIN);
    return tags;
  }
  // effective deadline = explicit node.deadline OR DDAY tag
  function effDeadline(n){ return n.deadline || getDday(n) || null; }
  // creation date proxy: earliest log date, else lastProgress, else today
  function createdDate(n){
    if(n.logs && n.logs.length){ const ds=n.logs.map(l=>l.date).filter(Boolean).sort(); if(ds.length) return ds[0]; }
    return n.lastProgress || todayStr();
  }
  // sorting deadline: real D-DAY, else implicit (creation + 7 days), so no-deadline
  // items still take a position in the priority order instead of sinking to the bottom.
  function sortDeadline(n){
    const real = effDeadline(n);
    if(real) return new Date(real).getTime();
    const c = new Date(createdDate(n)).getTime();
    return c + 7*24*3600*1000;
  }
  // a node is "in progress / 卡點" if it's not archived and not done/complete
  function inProgress(n){
    if(n.type==="portfolio") return n.portfolioState!=="archived";
    if(n.type==="work") return n.workStatus!=="done";
    if(n.type==="project"||n.type==="branch") return n.executionStage!=="complete";
    return false;
  }

  function load(){
    try { const r=localStorage.getItem(LS_KEY); if(r) S.nodes=JSON.parse(r); } catch(e){}
    try { const role=localStorage.getItem(LS_ROLE); if(role) S.role=role; } catch(e){}
    try { const u=localStorage.getItem(LS_SYNC_URL); if(u) S.syncUrl=u; } catch(e){}
    try { const d=localStorage.getItem(LS_DEVICE); if(d) S.syncDevice=d; } catch(e){}
    try { const m=localStorage.getItem(LS_SYNC_META); if(m) S.syncMeta=JSON.parse(m); } catch(e){}
    if(S.nodes) S.nodes = S.nodes.map(migrateNode);
  }
  // ── migration: upgrade logs to structured objects; lazily ready metadata/checklist ──
  // Never regenerate IDs. Never break imports. Backward compatible.
  function migrateNode(n){
    const m = Object.assign({}, n);
    // logs: string → {id,date,type,message}; preserve {date,signal,content} too
    m.logs = (Array.isArray(m.logs)?m.logs:[]).map(l=>{
      if(typeof l==="string") return { id:uid("log"), date:todayStr(), type:"note", message:l };
      if(l && (l.message!=null) && (l.type!=null)) return l; // already new
      // old {id,date,signal,content}
      return { id:l.id||uid("log"), date:l.date||todayStr(), type:l.type||"note", message:l.content!=null?l.content:(l.message||"") };
    });
    // metadata: create lazily but normalize priority; pull owner from legacy node.owner
    if(!m.metadata || typeof m.metadata!=="object") m.metadata = {};
    if(!m.metadata.priority) m.metadata.priority = "normal";
    if(m.metadata.owner==null && m.owner) m.metadata.owner = m.owner;
    // checklist removed from work (B.17.4) — drop any existing data
    if(m.type==="work"){ delete m.checklist; }
    // portfolio state migration: inbox/frozen → active (B.17.2)
    if(m.type==="portfolio" && (m.portfolioState==="inbox"||m.portfolioState==="frozen")){
      m.portfolioState = "active";
    }
    return m;
  }
  // structured log helpers
  function mkLog(type, message){ return { id:uid("log"), date:todayStr(), type:type||"note", message:message||"" }; }
  const LOG_TYPE_CFG = {
    progress:{i:"▸",c:"var(--moss)",label:"進度"},
    decision:{i:"◆",c:"var(--slate)",label:"決策"},
    blocker:{i:"🚧",c:"var(--clay)",label:"卡點"},
    note:{i:"✎",c:"var(--inkMid)",label:"備註"},
    milestone:{i:"★",c:"var(--bamboo)",label:"里程碑"},
  };
  // metadata helpers
  function getPriority(n){ return (n.metadata&&n.metadata.priority)||"normal"; }
  function getOwner(n){ return (n.metadata&&n.metadata.owner)||n.owner||""; }
  const PRIORITY_CFG = {
    critical:{i:"🔴",c:"var(--clay)",label:"緊急",rank:0},
    normal:{i:"⚪",c:"var(--inkMid)",label:"一般",rank:1},
    low:{i:"⚫",c:"var(--inkLight)",label:"次要",rank:2},
  };
  function priorityRank(n){ const p=getPriority(n); return (PRIORITY_CFG[p]||PRIORITY_CFG.normal).rank; }
  function setPriority(id, p){
    updateNode(id, n=>{ n.metadata=Object.assign({},n.metadata,{priority:p}); n.lastUpdated=todayStr(); return n; });
    render(); maybeSync("priority");
  }
  function cyclePriority(id){
    const n=byId(S.nodes,id); const order=["normal","critical","low"];
    const cur=getPriority(n); const next=order[(order.indexOf(cur)+1)%order.length];
    setPriority(id, next);
  }
  let _lastNodesJson = "";
  function persist(){
    try {
      if(S.nodes){
        const j = JSON.stringify(S.nodes);
        localStorage.setItem(LS_KEY, j);
        if(_lastNodesJson && j!==_lastNodesJson){ S.dirty = true; }
        _lastNodesJson = j;
      }
    } catch(e){}
    try { if(S.role) localStorage.setItem(LS_ROLE, S.role); } catch(e){}
    try { if(S.syncUrl) localStorage.setItem(LS_SYNC_URL, S.syncUrl); } catch(e){}
    try { if(S.syncDevice) localStorage.setItem(LS_DEVICE, S.syncDevice); } catch(e){}
    try { if(S.syncMeta) localStorage.setItem(LS_SYNC_META, JSON.stringify(S.syncMeta)); } catch(e){}
  }

  /* ═══ GOOGLE SHEETS SYNC (via Apps Script Web App) ═══════════════════════════
     Sync layer, NOT source of truth. Import › Merge › Export still governs.
     - pull(): GET ?action=load   → returns {nodes:[...], updatedAt, device}
     - push(): POST {action:save, nodes, device}
     Triggers: manual button · every 30s if dirty · on Done/Import/Capture-confirm
     Single user → last-write-wins.                                              */
  let syncTimer = null;
  function markDirty(){ S.dirty = true; }
  function deviceName(){ return S.syncDevice || "Device"; }

  async function syncPush(reason){
    if(!S.syncUrl){ return; }
    S.syncStatus="syncing"; S.syncMsg="同步中…"; safeRender();
    try {
      const res = await fetch(S.syncUrl, {
        method:"POST",
        headers:{ "Content-Type":"text/plain;charset=utf-8" }, // text/plain avoids CORS preflight to Apps Script
        body: JSON.stringify({ action:"save", device:deviceName(), nodes:S.nodes })
      });
      const data = await res.json();
      if(data && data.ok){
        S.dirty=false; S.syncStatus="ok";
        S.syncMeta={ at:new Date().toISOString(), device:deviceName() };
        S.syncMsg="已同步 "+(reason||"");
        persist();
      } else { throw new Error(data && data.error ? data.error : "save failed"); }
    } catch(err){
      S.syncStatus="error"; S.syncMsg="同步失敗：" + (err.message||err);
    }
    safeRender();
  }

  async function syncPull(opts){
    opts = opts || {};
    if(!S.syncUrl){ if(opts.alert) alert("尚未設定同步網址"); return; }
    S.syncStatus="syncing"; S.syncMsg="讀取雲端…"; safeRender();
    try {
      const res = await fetch(S.syncUrl + (S.syncUrl.indexOf("?")>-1?"&":"?") + "action=load", { method:"GET" });
      const data = await res.json();
      if(data && data.ok){
        const remote = Array.isArray(data.nodes) ? data.nodes.map(migrateNode) : [];
        if(opts.merge && S.nodes && S.nodes.length){
          // merge by id: remote is source for matched ids, keep local-only nodes
          const map = new Map(S.nodes.map(n=>[n.id,n]));
          remote.forEach(rn=>map.set(rn.id, rn));
          S.nodes = Array.from(map.values());
        } else {
          S.nodes = remote;
        }
        S.dirty=false; S.syncStatus="ok";
        S.syncMeta={ at:new Date().toISOString(), device:(data.device||"cloud") };
        S.syncMsg="已從雲端載入";
        persist();
        try { _lastNodesJson = JSON.stringify(S.nodes||[]); } catch(e){}
        S.dirty=false;
      } else { throw new Error(data && data.error ? data.error : "load failed"); }
    } catch(err){
      S.syncStatus="error"; S.syncMsg="讀取失敗：" + (err.message||err);
    }
    safeRender();
  }

  function startAutoSync(){
    if(syncTimer) clearInterval(syncTimer);
    syncTimer = setInterval(()=>{ if(S.syncUrl && S.dirty){ syncPush("auto"); } }, 30000);
  }
  function syncLabel(){
    if(!S.syncUrl) return "未連線";
    if(S.syncStatus==="syncing") return "同步中…";
    if(S.syncStatus==="error") return "⚠ " + S.syncMsg;
    if(S.syncMeta){
      const d=new Date(S.syncMeta.at);
      const hh=String(d.getHours()).padStart(2,"0"), mm=String(d.getMinutes()).padStart(2,"0");
      return `已同步 ${hh}:${mm} · ${S.syncMeta.device}` + (S.dirty?" ·有未同步":"");
    }
    return S.dirty?"有未同步變更":"已連線";
  }
  // guarded render so async callbacks before first render don't crash
  function safeRender(){ try{ render(); }catch(e){} }
  function syncSaveSettings(){
    S.syncUrl = (S.settingsUrlDraft!=null?S.settingsUrlDraft:S.syncUrl).trim();
    S.syncDevice = (S.settingsDevDraft!=null?S.settingsDevDraft:S.syncDevice).trim();
    S.settingsUrlDraft=""; S.settingsDevDraft="";
    persist();
    if(S.syncUrl) startAutoSync();
    S.syncMsg="設定已儲存"; render();
  }
  function syncClearSettings(){
    if(!confirm("清除同步設定？（雲端資料不會被刪，只是這台不再連線）")) return;
    S.syncUrl=""; S.syncMeta=null; S.syncStatus="idle";
    try{ localStorage.removeItem(LS_SYNC_URL); localStorage.removeItem(LS_SYNC_META); }catch(e){}
    if(syncTimer) clearInterval(syncTimer);
    render();
  }
  function maybeSync(reason){ if(S.syncUrl){ syncPush(reason); } }

  /* ─── tiny DOM helper ──────────────────────────────────────────────────── */
  const app = () => document.getElementById("app");
  function html(strings, ...vals){ return strings.reduce((a,s,i)=>a+s+(vals[i]!=null?vals[i]:""),""); }

  function pill(cfg, text, md){
    return `<span class="pill ${md?'md':''}" style="background:${cfg.bg};color:${cfg.c};border:1px solid ${cfg.c}28">${cfg.i} ${esc(text)}</span>`;
  }
  function typePill(t,md){ return pill(TYPE_CFG[t], lblEn(t), md); }
  function maturityPill(n,md){
    if(n.type==="portfolio") return pill(PORTFOLIO_CFG[n.portfolioState], lblEn(n.portfolioState), md);
    if(n.type==="work") return pill(WORK_CFG[n.workStatus], lblEn(n.workStatus), md);
    if(n.type==="project"||n.type==="branch") return pill(STAGE_CFG[n.executionStage], lblEn(n.executionStage), md);
    return "";
  }
  function staleBadge(n){ return isStale(n)?`<span class="badge-stale">⏱ ${daysSince(n.lastProgress)}d</span>`:""; }

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════ */
  function render(){
    persist();
    const root = app();
    if(!S.role){ root.innerHTML = viewLogin(); bind(); return; }
    if(S.nodes===null){ root.innerHTML = viewSeedGate(); bind(); return; }

    let screen = "";
    switch(S.view){
      case "daily":     screen = viewDaily(); break;
      case "capture":   screen = S.role==="bizdev"?viewCapture():viewDaily(); break;
      case "portfolio": screen = viewPortfolio(); break;
      case "import":    screen = S.role==="bizdev"?viewImport():viewDaily(); break;
      case "export":    screen = viewExport(); break;
      case "settings":  screen = viewSettings(); break;
      case "detail":    screen = viewDetail(); break;
      default:          screen = viewDaily();
    }
    const nav = S.view==="detail" ? "" : bottomNav();
    const overlay = S.moreFor ? moreModalHtml() : (S.moveFor ? moveModalHtml() : "");
    root.innerHTML = `<div class="screen">${screen}</div>${nav}${overlay}`;
    bind();
  }

  /* ─── login ────────────────────────────────────────────────────────────── */
  function viewLogin(){
    return html`
    <div class="login">
      <div class="center" style="margin-bottom:32px">
        <div class="brand">Kikō</div>
        <div class="tag">PMO OS · v4.1a</div>
      </div>
      <button class="opt" data-act="login" data-role="bizdev"
        style="background:var(--ink);color:#fff;box-shadow:var(--shadowMd)">
        <div style="font-size:20px;margin-bottom:4px">◎</div>
        <div class="t">Business Dev 業務端</div>
        <div class="d" style="color:rgba(255,255,255,.65)">Full access 完整權限</div>
      </button>
      <button class="opt" data-act="login" data-role="factory"
        style="background:var(--slateBg);color:var(--slate);border:1px solid rgba(106,127,150,.3)">
        <div style="font-size:20px;margin-bottom:4px">🏭</div>
        <div class="t">Factory 工廠端</div>
        <div class="d" style="opacity:.75">Read-only + work status 唯讀＋工作狀態</div>
      </button>
      <div style="margin-top:40px;font-size:10px;color:var(--inkLight)">Working memory layer · Import › Merge › Export</div>
    </div>`;
  }

  /* ─── seed gate ────────────────────────────────────────────────────────── */
  function viewSeedGate(){
    const created = SEED_NODES.length;
    const byType = SEED_NODES.reduce((a,n)=>{ a[n.type]=(a[n.type]||0)+1; return a; },{});
    const chips = Object.entries(byType).map(([t,n])=>pill(TYPE_CFG[t], lblEn(t)+" "+n)).join(" ");
    return html`
    <div class="pad">
      <div style="font-family:'Lora',serif;font-size:22px;margin-bottom:6px">Import Seed Data</div>
      <div style="font-size:13px;color:var(--inkMid);margin-bottom:4px">匯入種子資料</div>
      <p class="muted" style="font-size:12px;line-height:1.6;margin-bottom:20px">
        Consistent with Import › Merge › Export — nothing is auto-seeded. Review the diff, then confirm.
        依「匯入優先」原則，種子資料不會自動載入。請預覽後確認。
      </p>
      <div class="card" style="padding:16px;margin-bottom:16px">
        <span class="label">Preview Diff · Import Report</span>
        <div class="row2" style="gap:8px 16px;margin-top:8px">
          <div><span class="label">created 新增</span><div style="font-size:12px;color:var(--inkMid)">${created} nodes</div></div>
          <div><span class="label">updated 更新</span><div style="font-size:12px;color:var(--inkMid)">0</div></div>
          <div><span class="label">merged 合併</span><div style="font-size:12px;color:var(--inkMid)">0</div></div>
          <div><span class="label">conflicts 衝突</span><div style="font-size:12px;color:var(--inkMid)">0</div></div>
        </div>
        <div class="divider"></div>
        <div class="flex gap6 wrap">${chips}</div>
      </div>
      <div class="flex gap8">
        <button class="btn btn-ghost" style="flex:1" data-act="seed-skip">Start Empty 空白開始</button>
        <button class="btn btn-primary" style="flex:2" data-act="seed-confirm">Confirm Import 確認匯入 (${created})</button>
      </div>
    </div>`;
  }

  /* ─── topbar + nav ─────────────────────────────────────────────────────── */
  function topbar(title, sub, right){
    const roleChip = S.role
      ? `<span class="role-chip ${S.role==="factory"?"role-factory":"role-bizdev"}">${S.role==="factory"?"🏭 Factory":"◎ Bizdev"}</span>`
      : "";
    return html`
    <div class="topbar">
      <div><h1>${esc(title)}</h1>${sub?`<div class="sub">${esc(sub)}</div>`:""}</div>
      <div class="flex aic gap8">${roleChip}${right||""}</div>
    </div>`;
  }
  function bottomNav(){
    const items = S.role==="factory"
      ? [["daily","Daily 焦點","☀"],["portfolio","Account 對象","◉"],["export","Export 匯出","⤓"],["settings","Setup 設定","⚙"]]
      : [["daily","Daily 焦點","☀"],["capture","Input 輸入","✱"],["portfolio","Account 對象","◉"],
         ["import","Import 匯入","⤒"],["export","Export 匯出","⤓"],["settings","Setup 設定","⚙"]];
    return `<nav class="bottomnav">` + items.map(([id,label,ic])=>`
      <button data-act="nav" data-view="${id}" class="${S.view===id?"on":""}">
        <span class="ic">${ic}</span><span class="tx">${label}</span>
        ${S.view===id?'<span class="dot"></span>':""}
      </button>`).join("") + `</nav>`;
  }

  /* ─── DAILY (進行中待辦 + 有D-DAY的葉節點) ──────────────────────────────── */
  function viewDaily(){
    const ns = S.nodes;
    const codes = buildCodes(ns);
    const notArchived = n => { const r=rootPortfolio(ns,n); return !r || r.portfolioState!=="archived"; };

    // 1) in-progress leaf work
    const works = ns.filter(n=>n.type==="work" && n.workStatus!=="done" && !n.mergeIntoId && notArchived(n));
    // 2) branch/project that have a D-DAY but NO child work (so Daily wouldn't otherwise show them)
    const leafDated = ns.filter(n=>(n.type==="branch"||n.type==="project") && !n.mergeIntoId && notArchived(n)
      && n.executionStage!=="complete"
      && effDeadline(n)
      && !childrenOf(ns,n.id).some(c=>c.type==="work"));
    const items = works.concat(leafDated);

    const sorted = items.slice().sort((a,b)=>{
      const pa=isPinned(a)?0:1, pb=isPinned(b)?0:1;     // pin first
      if(pa!==pb) return pa-pb;
      const da=sortDeadline(a), db=sortDeadline(b);      // then D-DAY (implicit +7 for undated)
      if(da!==db) return da-db;
      return daysSince(b.lastProgress)-daysSince(a.lastProgress);
    });

    const right = `
      <button class="btn btn-ghost sm" data-act="toggle-advanced" title="切換進階">${S.advanced?"●":"○"} ${S.advanced?"Advanced":"Simple"}</button>
      <button class="btn btn-ghost sm" data-act="logout">切換 →</button>`;

    // group by account; order groups by their most-urgent member
    const groups = {};
    sorted.forEach(w=>{ const r=rootPortfolio(ns,w); const k=r?r.id:"_"; (groups[k]=groups[k]||[]).push(w); });
    const groupKeys = Object.keys(groups).sort((ka,kb)=>{
      const a=groups[ka], b=groups[kb];
      const pa=a.some(isPinned)?0:1, pb=b.some(isPinned)?0:1;
      if(pa!==pb) return pa-pb;
      const ma = Math.min.apply(null, a.map(sortDeadline));
      const mb = Math.min.apply(null, b.map(sortDeadline));
      return ma-mb;
    });

    let body = "";
    if(sorted.length===0){
      body = `<div class="empty">目前沒有進行中的工作 🎉<br><span style="font-size:11px">No work in progress.</span></div>`;
    } else {
      groupKeys.forEach(gid=>{
        const root = gid==="_"?null:byId(ns,gid);
        const head = root
          ? `<div class="flex aic gap8" style="margin:14px 2px 8px">
               <span style="font-size:12px;font-weight:700;color:var(--moss)">${S.advanced?"":(codes[root.id]+" ")}${esc(root.title)}</span>
               ${S.advanced?`<span class="tag">${lbl("portfolio")}</span>`:""}
             </div>`
          : "";
        body += head + groups[gid].map(w=>workCardHtml(w, codes, ns)).join("");
      });
    }

    return html`
    ${topbar("Daily 今日進行", fmt(todayStr()), right)}
    ${syncBar()}
    <div class="pad">
      <div class="muted" style="font-size:11px;margin-bottom:8px">
        所有未完成的待辦都在這裡，依交期排序（無交期者以建立日+7天估算；釘選同級才優先）。
      </div>
      <div class="flex gap6 wrap mb14" style="font-size:10px;color:var(--inkLight)">
        <span>✅ 完成</span><span>⏸ 延後</span><span>➕ 做更多</span>
      </div>
      ${body}
    </div>`;
  }

  // parent-context line: Account › Project › 工項
  function parentContext(n, ns, codes){
    const chain=[]; let cur=n.parentId?byId(ns,n.parentId):null, g=0;
    while(cur && g++<5){ chain.unshift(cur); cur=cur.parentId?byId(ns,cur.parentId):null; }
    if(!chain.length) return "";
    return chain.map(c=>esc(c.title)).join(" › ");
  }
  // Daily card context: 【Project】Branch (Account is the group heading, not here).
  // Recognition, not navigation — no full arrow path.
  function projectBranchContext(n, ns){
    let project=null, branch=null, cur=n.parentId?byId(ns,n.parentId):null, g=0;
    while(cur && g++<5){
      if(cur.type==="branch") branch=cur;
      if(cur.type==="project") project=cur;
      cur=cur.parentId?byId(ns,cur.parentId):null;
    }
    const parts=[];
    if(project) parts.push(`<span style="font-weight:600">【${esc(project.title)}】</span>`);
    if(branch) parts.push(esc(branch.title));
    return parts.join(" ");
  }
  // nearest ancestor project id (for Daily → Project deep link)
  function ownerProjectId(n, ns){
    let cur=n.parentId?byId(ns,n.parentId):null, g=0;
    while(cur && g++<5){ if(cur.type==="project") return cur.id; cur=cur.parentId?byId(ns,cur.parentId):null; }
    return n.type==="project"?n.id:null;
  }
  // the Project a log should attach to when adding a child under parentId
  function projectAncestor(ns, parentId, mode){
    let cur = byId(ns, parentId), g=0;
    while(cur && g++<6){ if(cur.type==="project") return cur; cur=cur.parentId?byId(ns,cur.parentId):null; }
    return null;
  }

  // a single Daily card: work OR dated leaf branch/project. 3 buttons + pin.
  function workCardHtml(w, codes, ns){
    ns = ns || S.nodes;
    const isWork = w.type==="work";
    const dd = effDeadline(w);
    const noDd = !dd;
    const implied = noDd ? new Date(sortDeadline(w)) : null;
    const overdue = dd && new Date(dd) < Date.now();
    const stale = isStale(w);
    const pinned = isPinned(w);
    const ctx = projectBranchContext(w, ns);
    const typeTag = !isWork ? `<span class="tag" style="background:var(--bambooBg);color:var(--bamboo)">${w.type==="branch"?"工項":"專案"}・待拆待辦</span>` : "";
    const lk = getLink(w);
    return html`
    <div class="card" style="padding:13px 14px;margin-bottom:8px;${pinned?'border-left:3px solid var(--bamboo)':''}">
      <div class="flex between aic" style="gap:8px">
        <div class="grow tap" data-act="open-from-daily" data-id="${w.id}">
          ${ctx?`<div style="font-size:10px;color:var(--inkLight);margin-bottom:3px">${ctx}</div>`:""}
          <div class="flex aic gap6" style="margin-bottom:2px">
            <span style="font-size:15px;font-weight:700">${esc(w.title)}</span>
            ${typeTag}
          </div>
          <div class="flex aic gap6 wrap" style="font-size:10px;color:var(--inkLight)">
            ${dd?`<span style="color:${overdue?'var(--clay)':'var(--inkLight)'}">D-DAY ${fmt(dd)}${overdue?' ⚠':''}</span>`
                :`<span title="無交期，以建立日+7天估算">交期未定（約 ${fmt(implied.toISOString().slice(0,10))}）</span>`}
            ${lk?`<a class="wlink" href="${esc(lk)}" target="_blank" rel="noopener" style="color:var(--slate);text-decoration:underline">🔗 連結</a>`:""}
          </div>
        </div>
        <button class="btn btn-ghost sm" data-act="pin" data-id="${w.id}" title="釘選" style="padding:4px 8px">${pinned?"📌":"📍"}</button>
      </div>
      <div class="flex gap6 mt10">
        <button class="btn sm" style="flex:1;background:var(--mossBg);color:var(--moss)" data-act="w-done" data-id="${w.id}">✅ 完成</button>
        <button class="btn sm" style="flex:1;background:var(--bgMuted);color:var(--inkMid)" data-act="w-delay" data-id="${w.id}">⏸ 延後</button>
        <button class="btn sm" style="flex:1;background:var(--bambooBg);color:var(--bamboo)" data-act="w-more" data-id="${w.id}">➕ 做更多</button>
      </div>
    </div>`;
  }

  function moreModalHtml(){
    const ns=S.nodes;
    const branch = byId(ns, S.moreFor);
    const codes = buildCodes(ns);
    const ctx = branch ? parentContext(branch, ns, codes) : "";
    return html`
    <div style="position:fixed;inset:0;z-index:200;background:rgba(28,26,23,.45);display:flex;align-items:flex-end;justify-content:center">
      <div class="up" style="background:var(--bgCard);border-radius:var(--r) var(--r) 0 0;width:100%;max-width:620px;padding:20px 20px 28px;box-shadow:var(--shadowMd)">
        <div class="flex between aic mb10">
          <div style="font-family:'Lora',serif;font-size:16px">➕ 新增待辦</div>
          <button class="back" data-act="more-cancel">×</button>
        </div>
        <div style="font-size:11px;color:var(--inkLight);margin-bottom:12px">
          ${ctx?ctx+" › ":""}<b>${esc(branch?branch.title:"")}</b> 底下
        </div>
        <div class="field"><span class="label">待辦 Work</span>
          <input type="text" data-more="title" value="${esc(S.moreTitle||"")}" placeholder="要做什麼" autofocus></div>
        <div class="field"><span class="label">交期 D-DAY（可留空）</span>
          <input type="date" data-more="dday" value="${esc(S.moreDday||"")}"></div>
        <div class="flex gap8 mt10">
          <button class="btn btn-ghost" style="flex:1" data-act="more-cancel">取消</button>
          <button class="btn btn-primary" style="flex:2" data-act="more-save">新增</button>
        </div>
      </div>
    </div>`;
  }

  // 移動到… modal: pick a new parent of the correct type
  function moveModalHtml(){
    const ns = S.nodes;
    const node = byId(ns, S.moveFor);
    if(!node) return "";
    const codes = buildCodes(ns);
    // valid new parents by child type
    const parentType = { work:"branch", branch:"project", project:"portfolio" }[node.type];
    if(!parentType){ // portfolio can't be re-parented
      return `<div style="position:fixed;inset:0;z-index:200;background:rgba(28,26,23,.45);display:flex;align-items:flex-end;justify-content:center">
        <div class="up" style="background:var(--bgCard);border-radius:var(--r) var(--r) 0 0;width:100%;max-width:620px;padding:20px">
          <div class="flex between aic mb10"><div style="font-family:'Lora',serif;font-size:16px">搬移</div><button class="back" data-act="move-cancel">×</button></div>
          <div class="muted" style="font-size:12px">對象（最上層）不能搬移到別人底下。</div>
          <button class="btn btn-ghost full mt14" data-act="move-cancel">關閉</button>
        </div></div>`;
    }
    const candidates = ns.filter(n=>n.type===parentType && !n.mergeIntoId && n.id!==node.parentId);
    const word = { branch:"工項", project:"專案", portfolio:"對象" }[parentType];
    const rows = candidates.length
      ? candidates.map(c=>`<button class="btn btn-secondary full mb6" style="justify-content:flex-start" data-act="move-to" data-pid="${c.id}">
           ${codes[c.id]?`<span style="color:var(--inkLight);font-weight:700">${codes[c.id]}</span> `:""}${esc(c.title)}
         </button>`).join("")
      : `<div class="muted" style="font-size:12px;padding:8px 0">沒有其他可放的${word}。</div>`;
    return html`
    <div style="position:fixed;inset:0;z-index:200;background:rgba(28,26,23,.45);display:flex;align-items:flex-end;justify-content:center">
      <div class="up" style="background:var(--bgCard);border-radius:var(--r) var(--r) 0 0;width:100%;max-width:620px;padding:20px 20px 28px;box-shadow:var(--shadowMd);max-height:80vh;overflow:auto">
        <div class="flex between aic mb10">
          <div style="font-family:'Lora',serif;font-size:16px">搬移「${esc(node.title)}」到哪個${word}？</div>
          <button class="back" data-act="move-cancel">×</button>
        </div>
        <div class="muted" style="font-size:11px;margin-bottom:10px">選一個新的上層，確認後就會搬過去（歷程保留）。</div>
        ${rows}
        <button class="btn btn-ghost full mt8" data-act="move-cancel">取消</button>
      </div>
    </div>`;
  }

  /* ─── CAPTURE ──────────────────────────────────────────────────────────── */
  // capture session state.
  //  pick = { mode:'update'|'work'|'branch'|'project'|'account', parentId } chosen from tree
  //  nexts = list of 待辦(work) titles when creating work (multiple)
  // Input flow: choose/create Account → tree-pick to add child (confirm hierarchy) → optional log
  const cap = { images:[], signal:"screenshot",
                accountId:null,      // chosen existing Account (portfolio) id
                newAccountName:"",   // when creating a new Account
                newAccountMode:"explore",
                link:"", dday:"", title:"", mode:"explore",
                pick:null,           // {mode,parentId} chosen from the tree under accountId
                nexts:[],            // multiple work titles
                logText:"", logDate:"", logType:"progress",  // optional log (on Project level)
                q_ball:"" };
  function viewCapture(){
    const ns = S.nodes;
    const codes = buildCodes(ns);
    const right = `<button class="btn btn-ghost sm" data-act="toggle-advanced">${S.advanced?"\u25cf":"\u25cb"} ${S.advanced?"Advanced":"Simple"}</button>`;
    const accounts = ns.filter(n=>n.type==="portfolio"&&!n.mergeIntoId);
    const acct = cap.accountId ? byId(ns, cap.accountId) : null;

    // STAGE 1: no account chosen yet → choose existing or create new
    if(!acct){
      return html`
      ${topbar("Input \u8f38\u5165", "\u9078\u5c0d\u8c61 \u2192 \u52a0\u5b50\u9805 \u2192 \uff08\u9078\u586b\uff09log", right)}
      <div class="pad">
        <div class="note-muted" style="border-radius:var(--r);padding:12px 14px;margin-bottom:16px;font-size:11px;line-height:1.6">
          \u5148\u9078\u4e00\u500b\u5c0d\u8c61\uff08Account\uff09\uff0c\u6216\u65b0\u5efa\u4e00\u500b\u3002\u9078\u5b9a\u5f8c\u624d\u6703\u51fa\u73fe\u6a39\u72c0\u5716\u8b93\u4f60\u52a0\u5b50\u9805\u3002
        </div>

        <div class="sect">\u2795 \u65b0\u5efa\u5c0d\u8c61 Account</div>
        <div class="card" style="padding:12px">
          <div class="field"><span class="label">\u5c0d\u8c61\u540d\u7a31</span>
            <input type="text" data-cap="newAccountName" value="${esc(cap.newAccountName)}" placeholder="\u4f8b\uff1a\u67d0\u5ba2\u6236 / \u67d0\u8a08\u756b"></div>
          <div class="field"><span class="label">\u985e\u578b Mode</span>
            <select data-cap="newAccountMode">${["deliver","build","explore"].map(m=>`<option value="${m}" ${cap.newAccountMode===m?"selected":""}>${S.advanced?lbl(m):({deliver:"\u8981\u4ea4\u4ed8\u7684",build:"\u8981\u5efa\u69cb\u7684",explore:"\u8981\u63a2\u7d22\u7684"}[m])}</option>`).join("")}</select></div>
          <button class="btn btn-primary full" data-act="cap-newaccount" ${cap.newAccountName.trim()?"":"disabled"}>\u5efa\u7acb\u4e26\u9078\u5b9a</button>
        </div>

        <div class="sect">\u6216\uff1a\u9078\u73fe\u6709\u5c0d\u8c61</div>
        <div class="card" style="padding:8px 10px">
          ${accounts.length? accounts.map(a=>`
            <button class="btn btn-ghost full mb6" style="justify-content:flex-start" data-act="cap-pickaccount" data-id="${a.id}">
              \u25c9 ${esc(a.title)} <span style="color:var(--inkLight);font-size:10px;margin-left:6px">${childrenOf(ns,a.id).filter(n=>n.type==="project").length} \u500b\u5c08\u6848</span>
            </button>`).join("") : `<div class="muted" style="font-size:11px;padding:6px">\u9084\u6c92\u6709\u5c0d\u8c61\uff0c\u5148\u65b0\u5efa\u4e00\u500b\u3002</div>`}
        </div>
      </div>`;
    }

    // STAGE 2: account chosen → tree (add child) + optional log
    const pick = cap.pick;
    function pickedLabel(){
      if(!pick) return "";
      const p = byId(ns, pick.parentId);
      const childWord = { work:"\u65b0\u5f85\u8fa6\u65bc", branch:"\u65b0\u5de5\u9805\u65bc", project:"\u65b0\u5c08\u6848\u65bc" }[pick.mode];
      return `${childWord}\uff1a${p?(codes[p.id]?codes[p.id]+" ":"")+p.title:""}`;
    }
    function treeNode(n, depth){
      const indent = depth*14;
      const kids = childrenOf(ns,n.id);
      const childMode = { portfolio:"project", project:"branch", branch:"work" }[n.type];
      const childWord = { project:"\u2795\u65b0\u5c08\u6848", branch:"\u2795\u65b0\u5de5\u9805", work:"\u2795\u65b0\u5f85\u8fa6" }[childMode];
      const isPickedAdd = pick && pick.mode===childMode && pick.parentId===n.id;
      let out = `
        <div style="margin-left:${indent}px;display:flex;align-items:center;gap:6px;padding:3px 0">
          <span style="flex:1;font-size:11px;color:var(--inkMid)">${codes[n.id]?`<span style="color:var(--inkLight);font-weight:700">${codes[n.id]}</span> `:""}${esc(n.title)}</span>
          ${childMode?`<button class="btn ${isPickedAdd?'btn-moss':'btn-secondary'}" style="padding:3px 8px;font-size:10px;white-space:nowrap" data-act="cap-pick" data-mode="${childMode}" data-pid="${n.id}">${childWord}</button>`:""}
        </div>`;
      kids.forEach(k=>{ out += treeNode(k, depth+1); });
      return out;
    }
    const treeHtml = treeNode(acct, 0);

    // detail block for the picked add-target
    let detailBlock = "";
    if(pick){
      if(pick.mode==="work"){
        const chips = cap.nexts.map((t,i)=>`<div class="flex aic gap6" style="margin-bottom:4px"><span class="tag" style="flex:1;text-align:left">${esc(t)}</span><button class="btn btn-ghost" style="padding:2px 7px;font-size:11px" data-act="cap-rmnext" data-idx="${i}">\u00d7</button></div>`).join("");
        detailBlock = html`
          <div class="card" style="padding:12px;margin-top:12px">
            <span class="label">\u5f85\u8fa6\u6e05\u55ae\uff08\u53ef\u591a\u7b46\uff09</span>
            ${chips}
            <div class="flex gap6">
              <input type="text" data-cap="title" value="${esc(cap.title)}" placeholder="\u4e00\u500b\u5f85\u8fa6\u52d5\u4f5c" style="flex:1">
              <button class="btn btn-secondary" data-act="cap-addnext">\uff0b \u52a0\u5f85\u8fa6</button>
            </div>
            <div class="row2 mt10">
              <div class="field"><span class="label">\u4ea4\u671f D-DAY\uff08\u53ef\u7a7a\uff09</span><input type="date" data-cap="dday" value="${esc(cap.dday)}"></div>
              <div class="field"><span class="label">\u9023\u7d50\uff08\u53ef\u7a7a\uff09</span><input type="text" data-cap="link" value="${esc(cap.link)}" placeholder="https://\u2026"></div>
            </div>
          </div>`;
      } else {
        const word = pick.mode==="project"?"\u5c08\u6848":"\u5de5\u9805";
        detailBlock = html`
          <div class="card" style="padding:12px;margin-top:12px">
            <div class="field"><span class="label">${word}\u540d\u7a31</span><input type="text" data-cap="title" value="${esc(cap.title)}" placeholder="\u9019\u500b${word}\u53eb\u4ec0\u9ebc"></div>
            <div class="row2">
              <div class="field"><span class="label">\u4ea4\u671f D-DAY\uff08\u53ef\u7a7a\uff09</span><input type="date" data-cap="dday" value="${esc(cap.dday)}"></div>
              <div class="field"><span class="label">\u9023\u7d50\uff08\u53ef\u7a7a\uff09</span><input type="text" data-cap="link" value="${esc(cap.link)}" placeholder="https://\u2026"></div>
            </div>
          </div>`;
      }
    }

    // optional log — always lands on the owning Project level; date selectable
    const logProject = pick ? projectAncestor(ns, pick.parentId, pick.mode) : null;
    const logBlock = html`
      <div class="sect">\uff08\u9078\u586b\uff09\u8a18\u4e00\u7b46 log \u2014 \u8a18\u5728\u5c08\u6848\u5c64</div>
      <div class="card" style="padding:12px">
        ${logProject?`<div class="muted" style="font-size:10px;margin-bottom:8px">\u6703\u8a18\u5230\u5c08\u6848\uff1a<b>${esc(logProject.title)}</b></div>`:`<div class="muted" style="font-size:10px;margin-bottom:8px">\u9078\u4e0a\u9762\u4e00\u500b\u4f4d\u7f6e\u5f8c\uff0clog \u6703\u81ea\u52d5\u6b78\u5230\u6240\u5c6c\u5c08\u6848\u3002</div>`}
        <textarea data-cap="logText" rows="2" placeholder="\u767c\u751f\u4e86\u4ec0\u9ebc\uff08\u53ef\u7559\u7a7a\uff09\u2026">${esc(cap.logText)}</textarea>
        <div class="row2 mt8">
          <div class="field"><span class="label">\u65e5\u671f</span><input type="date" data-cap="logDate" value="${esc(cap.logDate||todayStr())}"></div>
          <div class="field"><span class="label">\u985e\u578b</span>
            <select data-cap="logType">${["progress","decision","blocker","note","milestone"].map(k=>`<option value="${k}" ${cap.logType===k?"selected":""}>${(LOG_TYPE_CFG[k]||{}).label||k}</option>`).join("")}</select></div>
        </div>
      </div>`;

    const canCommit = !!pick && (pick.mode!=="work" ? !!cap.title.trim() : (cap.nexts.length>0||cap.title.trim()));

    return html`
    ${topbar("Input \u8f38\u5165", esc(acct.title), right)}
    <div class="pad">
      <div class="flex between aic" style="margin-bottom:12px">
        <div style="font-size:13px;font-weight:600">\u25c9 ${esc(acct.title)}</div>
        <button class="btn btn-ghost sm" data-act="cap-clearaccount">\u63db\u5c0d\u8c61</button>
      </div>

      <div class="sect">\u2460 \u5728\u6a39\u72c0\u5716\u52a0\u5b50\u9805\uff08\u78ba\u8a8d\u968e\u5c64\uff09</div>
      <div class="card" style="padding:10px 12px">
        <div style="max-height:240px;overflow:auto">${treeHtml}</div>
      </div>
      ${pick?`<div class="note-muted" style="border-radius:var(--rsm);padding:8px 12px;margin-top:10px;font-size:11px;color:var(--moss)">\u5df2\u9078\uff1a${esc(pickedLabel())}</div>`:""}
      ${detailBlock}

      ${pick?logBlock:""}

      <button class="btn btn-primary full mt14" data-act="cap-commit">建立並歸位</button>
      <div class="center muted" style="font-size:10px;margin-top:8px">先點上面的 ➕ 選位置並填名稱，再按這裡。由你確認，不自動建立。</div>
    </div>`;
  }

  /* ─── PORTFOLIO ────────────────────────────────────────────────────────── */
  // roll up descendant 待辦(work) status: done ✅ / blocked 🚧 / pending ⏳
  // a 工項(branch) is AUTO-blocked if no child work moved in >7 days, OR any child work is deferred(⏸延後)
  function branchAutoBlocked(ns, branch){
    const works = childrenOf(ns,branch.id).filter(c=>c.type==="work");
    if(!works.length) return false;
    const anyDeferred = works.some(w=>(w.tags||[]).indexOf("⏸延後")>-1 && w.workStatus!=="done");
    if(anyDeferred) return true;
    const openWorks = works.filter(w=>w.workStatus!=="done");
    if(!openWorks.length) return false;
    // movement = max lastProgress among open works; blocked if all idle >7d
    const freshest = Math.min.apply(null, openWorks.map(w=>daysSince(w.lastProgress)));
    return freshest > 7;
  }
  function statusRollup(ns, nodeId){
    let done=0, blocked=0, pending=0;
    function walk(id){
      childrenOf(ns,id).forEach(c=>{
        if(c.type==="work"){
          if(c.workStatus==="done") done++;
          else pending++;
        } else if(c.type==="branch"){
          if(branchAutoBlocked(ns,c)) blocked++;   // count auto-blocked 工項
        }
        walk(c.id);
      });
    }
    walk(nodeId);
    return { done, blocked, pending };
  }
  function rollupBadges(r){
    if(r.done+r.blocked+r.pending===0) return "";
    const parts=[];
    if(r.blocked) parts.push(`<span style="color:var(--clay)">🚧${r.blocked}</span>`);
    if(r.pending) parts.push(`<span style="color:var(--bamboo)">⏳${r.pending}</span>`);
    if(r.done) parts.push(`<span style="color:var(--moss)">✅${r.done}</span>`);
    return `<span class="flex aic gap6" style="font-size:10px;font-weight:700">${parts.join("")}</span>`;
  }
  // sort siblings: more blocked first, then more pending
  function byBlocked(ns){
    return (a,b)=>{
      const ra=statusRollup(ns,a.id), rb=statusRollup(ns,b.id);
      // a branch that is itself auto-blocked counts as blocked for ordering
      const ba=(a.type==="branch"&&branchAutoBlocked(ns,a))?1:0;
      const bb=(b.type==="branch"&&branchAutoBlocked(ns,b))?1:0;
      const tba=rb.blocked+bb-(ra.blocked+ba);
      if(tba!==0) return tba;
      if(rb.pending!==ra.pending) return rb.pending-ra.pending;
      return 0;
    };
  }
  function nodeRowHtml(node, ns, depth){
    const kids = childrenOf(ns,node.id).slice().sort(byBlocked(ns));
    const hasKids = kids.length>0;
    const indent = depth*16;
    const roll = node.type!=="work" ? statusRollup(ns,node.id) : null;
    const toggle = hasKids
      ? `<button class="tree-toggle" data-act="toggle" data-id="${node.id}">${S.expanded[node.id]?"▾":"▸"}</button>`
      : `<span style="width:14px;flex-shrink:0"></span>`;
    // a 工項(branch) that is auto-blocked shows 🚧
    const selfBlocked = node.type==="branch" && branchAutoBlocked(ns,node);
    let out = html`
      <div class="node-row" style="margin-left:${indent}px;border-left:3px solid ${TYPE_CFG[node.type].c}" data-act="open" data-id="${node.id}">
        ${toggle}
        <div class="grow">
          <div class="title">${selfBlocked?"🚧 ":""}${esc(node.title)}</div>
          ${node.firstSuccessEvent?`<div class="sub">→ ${esc(node.firstSuccessEvent)}</div>`:""}
        </div>
        <div class="flex aic" style="gap:5px;flex-shrink:0">
          ${roll?rollupBadges(roll):""}${staleBadge(node)}${S.advanced?typePill(node.type):""}
        </div>
      </div>`;
    if(hasKids && S.expanded[node.id]){
      out += kids.map(k=>nodeRowHtml(k, ns, depth+1)).join("");
    }
    return out;
  }
  function viewPortfolio(){
    const ns = S.nodes;
    const states = ["active","incubator"];
    const portfolios = ns.filter(n=>n.type==="portfolio"&&n.portfolioState===S.pfFilter&&!n.mergeIntoId).slice().sort(byBlocked(ns));
    const wip = wipCounts(ns);
    const activeCount = ns.filter(n=>n.type==="portfolio"&&n.portfolioState==="active").length;

    const wipHtml = [["deliver","Deliver"],["build","Build"],["explore","Explore"]].map(([m,label])=>`
      <div class="cell"><div class="k">${label}</div>
        <div class="v" style="color:${wip[m]>WIP_LIMITS[m]?"var(--clay)":"var(--moss)"}">${wip[m]} <span style="font-size:10px;color:var(--inkLight);font-weight:400">/ ${WIP_LIMITS[m]}</span></div>
      </div>`).join("");

    const chipsHtml = states.map(s=>{
      const c=PORTFOLIO_CFG[s];
      const n=ns.filter(x=>x.type==="portfolio"&&x.portfolioState===s).length;
      const on=S.pfFilter===s;
      return `<button data-act="pf" data-state="${s}" class="${on?"on":""}" style="${on?`background:${c.c};color:#fff`:`background:${c.bg};color:${c.c}`}">${c.i} ${lblZh(s)} <span style="opacity:.7">${n}</span></button>`;
    }).join("");

    const archivedCount = ns.filter(x=>x.type==="portfolio"&&x.portfolioState==="archived").length;
    const archivedLink = archivedCount>0
      ? `<div style="text-align:center;margin-top:16px"><button data-act="pf" data-state="archived" style="background:none;border:none;font-size:11px;color:var(--inkLight);text-decoration:underline;cursor:pointer">查看封存記錄 (${archivedCount})</button></div>`
      : "";

    let body;
    if(portfolios.length===0){
      body = `<div class="empty">此狀態無對象</div>`;
    } else {
      body = portfolios.map(p=>{
        const roll = statusRollup(ns,p.id);
        const projects = childrenOf(ns,p.id).filter(n=>n.type==="project").slice().sort(byBlocked(ns));
        // each project = a card with bold name + bulleted branch/work outline (static preview)
        const projectCards = projects.length ? projects.map(proj=>{
          const branches = childrenOf(ns,proj.id).filter(n=>n.type==="branch");
          const proll = statusRollup(ns,proj.id);
          const dd = effDeadline(proj);
          // outline: branches, each with its works as sub-bullets (shallow, non-interactive preview)
          const outline = branches.map(br=>{
            const works = childrenOf(ns,br.id).filter(n=>n.type==="work");
            const blocked = branchAutoBlocked(ns,br);
            const wbul = works.slice(0,5).map(w=>`<div style="font-size:10px;color:var(--inkLight);margin-left:14px">· ${w.workStatus==="done"?'<span style="color:var(--moss)">✓</span> ':""}${esc(w.title)}</div>`).join("");
            return `<div style="margin-top:5px">
              <div style="font-size:11px;color:var(--inkMid)">${blocked?"🚧 ":"▸ "}${esc(br.title)}</div>
              ${wbul}${works.length>5?`<div style="font-size:10px;color:var(--inkLight);margin-left:14px">… 還有 ${works.length-5} 項</div>`:""}
            </div>`;
          }).join("") || `<div style="font-size:10px;color:var(--inkLight);margin-top:4px">尚無工項</div>`;
          return `
          <div class="card tap" data-act="open" data-id="${proj.id}" style="padding:13px 14px;margin-bottom:10px">
            <div class="flex between aic" style="gap:8px">
              <span style="font-size:14px;font-weight:700;flex:1">${esc(proj.title)}</span>
              ${rollupBadges(proll)}
            </div>
            ${dd?`<div style="font-size:10px;color:var(--inkLight);margin-top:2px">📅 ${fmt(dd)}</div>`:""}
            ${outline}
          </div>`;
        }).join("") : `<div class="muted" style="font-size:11px;padding:4px 2px 10px">此對象底下還沒有專案。</div>`;

        return `
        <div class="up" style="margin-bottom:22px">
          <div class="flex aic gap8 mb10" style="padding:0 2px">
            <span style="font-size:15px;color:var(--moss)">◉</span>
            <span class="tap" data-act="open" data-id="${p.id}" style="font-size:15px;font-weight:600;flex:1">${esc(p.title)}</span>
            ${rollupBadges(roll)}
            ${pill({c:"var(--inkMid)",bg:"var(--bgMuted)",i:"◷"}, lblEn(p.projectMode))}
          </div>
          ${projectCards}
        </div>`;
      }).join("");
    }

    return html`
    ${topbar("Account 對象", activeCount+" active")}
    <div class="wip">${wipHtml}</div>
    <div class="chips">${chipsHtml}</div>
    <div class="pad-wide" style="max-width:560px;margin:0 auto">${body}${archivedLink}</div>`;
  }

  /* ─── DETAIL ───────────────────────────────────────────────────────────── */
  const det = { logText:"", logSignal:"manual", showTransform:false };
  function viewDetail(){
    const ns = S.nodes;
    const node = byId(ns, S.selectedId);
    if(!node){ S.view="daily"; return viewDaily(); }
    const isFactory = S.role==="factory";
    const kids = childrenOf(ns, node.id);

    const maturityOpts = node.type==="portfolio" ? ["active","incubator","archived"]
      : node.type==="work" ? ["todo","doing","done"]
      : ["ready","developing","blocked","complete"];
    const curMaturity = node.portfolioState||node.workStatus||node.executionStage;

    const transforms = {
      project:[{to:"branch",label:"轉為工項 → Branch"}],
      branch:[{to:"work",label:"轉為待辦 → Work"}],
      work:[{to:"project",label:"Convert → Project 轉為專案"}],
      portfolio:[{to:"frozen",label:"Freeze 凍結",freeze:true}],
    }[node.type] || [];

    /* portfolio: inline state selector in header */
    const pfStateBar = node.type==="portfolio" ? html`
    <div class="flex gap6 wrap" style="margin-bottom:12px">
      ${maturityOpts.map(s=>{
        const cfg = PORTFOLIO_CFG[s];
        const on = (node.portfolioState||"active")===s;
        return `<button data-act="set-maturity" data-val="${s}" style="padding:5px 11px;border:none;border-radius:99px;font-size:11px;font-weight:600;cursor:pointer;${on?`background:${cfg.c};color:#fff`:`background:${cfg.bg};color:${cfg.c};border:1px solid ${cfg.c}30`}">${cfg.i} ${lblEn(s)}</button>`;
      }).join("")}
    </div>` : "";

    /* header */
    const header = html`
    <div class="detail-head">
      <div class="flex aic gap8 mb10" style="align-items:flex-start">
        <button class="back" data-act="back">←</button>
        <div class="grow">
          <div class="flex aic gap6 mb6">
            ${typePill(node.type)}
            ${node.mergeIntoId?pill({c:"var(--inkLight)",bg:"var(--bgMuted)",i:"⤳"},"merged"):""}
          </div>
          ${S.editTitleId===node.id
            ? `<input type="text" id="title-edit-input" data-act-title="save" value="${esc(node.title)}" style="font-family:'Lora',serif;font-size:17px;font-weight:400;line-height:1.25;width:100%;border:none;border-bottom:2px solid var(--bamboo);background:transparent;padding:2px 0;outline:none">`
            : `<div class="flex aic gap6" style="align-items:flex-start">
                <h2 style="font-family:'Lora',serif;font-size:17px;font-weight:400;line-height:1.25;flex:1">${esc(node.title)}</h2>
                ${!isFactory?`<button data-act="title-edit" data-id="${node.id}" style="background:none;border:none;font-size:13px;color:var(--inkLight);cursor:pointer;padding:2px 4px;flex-shrink:0;margin-top:1px" title="改名">✎</button>`:""}
              </div>`
          }
        </div>
        ${(!isFactory&&!node.mergeIntoId&&node.type!=="portfolio")?`<button class="btn btn-ghost sm" data-act="move-start" data-id="${node.id}">⇄ 搬移</button>`:""}
        ${(!isFactory&&node.type==="portfolio")?`<button class="btn btn-ghost sm" data-act="node-delete" data-id="${node.id}" style="color:var(--clay)">✕ 刪除</button>`:""}
      </div>
      ${pfStateBar}
      <div class="flex aic gap6 wrap mb14">
        ${node.type!=="portfolio"?maturityPill(node,true):""}${staleBadge(node)}
        <span style="font-size:11px;color:var(--inkLight);margin-left:auto">progress ${fmt(node.lastProgress)} · ${lblEn(node.progressSignal||"manual")}</span>
      </div>
      <div class="tabs">
        ${[["info","總覽"],["branch","專案樹狀圖"]].map(([id,t])=>`
          <button data-act="tab" data-tab="${id}" class="${(S.detailTab===id||(id==="info"&&S.detailTab!=="branch"))?"on":""}">${t}</button>`).join("")}
      </div>
    </div>`;

    /* transform panel */
    let transformPanel = "";
    if(det.showTransform && !isFactory){
      transformPanel = html`
      <div class="inx" style="background:var(--bambooBg);border:1px solid rgba(184,168,120,.4);border-radius:var(--r);padding:14px;margin-bottom:16px">
        <span class="label">Merge / Split / Convert — history preserved 保留歷史</span>
        ${transforms.map(t=>`<button class="btn btn-secondary sm full mb6" style="justify-content:flex-start" data-act="transform" data-to="${t.to}" data-freeze="${t.freeze?1:0}">${t.label}</button>`).join("")}
        <div class="muted" style="font-size:10px;margin-top:6px">Convert keeps the original visible in history (transformFrom). 轉換會保留來源。</div>
      </div>`;
    }

    /* tab body */
    let tabBody = "";
    const onBranchTab = S.detailTab==="branch";
    if(!onBranchTab){
      // ── 總覽 Overview: stakeholders/contacts · status · notes(facts) · checklist(work) · unified logs(history) ──
      // For portfolio: state selector is in the header, not here
      const maturityControl = (!isFactory || node.type==="work") && node.type!=="portfolio" ? html`
        <div class="mb14">
          <span class="label">${node.type==="work"?"待辦狀態":"執行階段"}</span>
          <div class="flex gap6 wrap">
            ${maturityOpts.map(s=>{
              const cfg = node.type==="work"?WORK_CFG[s]:STAGE_CFG[s];
              const on = curMaturity===s;
              return `<button data-act="set-maturity" data-val="${s}" style="padding:5px 11px;border:none;border-radius:99px;font-size:11px;font-weight:600;${on?`background:${cfg.c};color:#fff`:`background:${cfg.bg};color:${cfg.c};border:1px solid ${cfg.c}30`}">${cfg.i} ${lblEn(s)}</button>`;
            }).join("")}
          </div>
        </div>` : "";

      // summary: editable textarea for portfolio; static paragraph for others
      const summaryBlock = node.type==="portfolio"
        ? html`<div class="card" style="padding:12px 14px;margin-bottom:14px">
            <span class="label" style="margin-bottom:6px;display:block">摘要</span>
            <textarea data-det="summaryDraft" rows="3" placeholder="這個對象目前的方向或狀態…" style="width:100%;box-sizing:border-box">${esc(node.summary||"")}</textarea>
            <button class="btn btn-secondary sm" data-act="summary-save" style="margin-top:6px">儲存</button>
          </div>`
        : (node.summary ? `<p style="font-size:13px;color:var(--inkMid);line-height:1.7;margin-bottom:14px">${esc(node.summary)}</p>` : "");

      // stakeholders / contacts (only this from old facts cluster)
      const stake = (node.stakeholders&&node.stakeholders.length)
        ? `<div class="card" style="padding:11px 13px;margin-bottom:12px"><span class="label">利害關係人 / 聯絡人</span>${node.stakeholders.map(s=>`<div style="font-size:12px;color:var(--inkMid);padding:3px 0">${esc(s.name)}${s.role?" · "+esc(s.role):""}${s.channel?" · "+esc(s.channel):""}</div>`).join("")}</div>` : "";

      // metadata row for project/branch/work (no priority cycle now — pin lives on Daily)
      const showMeta = node.type!=="portfolio";
      const lk = getLink(node);
      const metaRow = showMeta ? html`
      <div class="card" style="padding:11px 13px;margin-bottom:12px">
        <div class="flex aic gap8 wrap" style="font-size:11px">
          <label style="display:flex;align-items:center;gap:5px;color:var(--inkMid);cursor:pointer">
            📅
            <input type="date" data-act-deadline="${node.id}" value="${esc(node.deadline||"")}"
              style="font-size:11px;border:none;border-bottom:1px solid var(--inkLight);background:transparent;color:var(--inkMid);padding:1px 2px;cursor:pointer;outline:none;width:120px"
              title="交期 D-DAY">
            ${node.deadline?`<button data-act="deadline-clear" style="background:none;border:none;font-size:10px;color:var(--inkLight);cursor:pointer;padding:0 2px" title="清除交期">✕</button>`:""}
          </label>
          ${isPinned(node)?`<span style="color:var(--bamboo)">📌 已釘選</span>`:""}
          ${lk?`<a class="wlink" href="${esc(lk)}" target="_blank" rel="noopener" style="color:var(--slate);text-decoration:underline">🔗 連結</a>`:""}
        </div>
      </div>` : "";

      // notes = reference / facts (≤5, clickable URLs)
      const notes = getNotes(node);
      const notesBlock = html`
      <div class="card" style="padding:12px 14px;margin-bottom:14px;background:var(--bambooBg);border-color:rgba(184,168,120,.35)">
        <div class="flex between aic mb8"><span class="label" style="margin:0">📌 備註・參考・連結（${notes.length}/5）</span></div>
        ${notes.length? notes.map((nt,i)=>`
          <div class="flex aic gap6" style="margin-bottom:6px">
            <div style="flex:1;font-size:12px;font-weight:600;color:var(--inkMid);line-height:1.5">${linkifyNote(nt)}</div>
            <button class="btn btn-ghost" style="padding:2px 7px;font-size:11px" data-act="note-del" data-idx="${i}">×</button>
          </div>`).join("") : `<div class="muted" style="font-size:11px;margin-bottom:6px">參考資料 / 事實 / 連結放這裡。</div>`}
        ${notes.length<5?`
          <div class="flex gap6 mt6">
            <input type="text" data-note="draft" value="${esc(S.noteDraft||"")}" placeholder="輸入參考或貼上 https://…" style="flex:1">
            <button class="btn btn-secondary" data-act="note-add">＋ 加</button>
          </div>`:`<div class="muted" style="font-size:10px">已達 5 則上限。</div>`}
      </div>`;

      // logs = historical events. For a Project, unify all descendant logs here.
      let logSource;
      if(node.type==="project"||node.type==="portfolio"){
        logSource = [];
        (function walk(id){ childrenOf(S.nodes,id).forEach(c=>{ (c.logs||[]).forEach(l=>logSource.push({l,from:c})); walk(c.id); }); })(node.id);
        (node.logs||[]).forEach(l=>logSource.push({l,from:node}));
        logSource.sort((a,b)=> (b.l.date||"").localeCompare(a.l.date||""));
      } else {
        logSource = (node.logs||[]).slice().reverse().map(l=>({l,from:node}));
      }
      const logsHtml = logSource.map(({l,from})=>{
        const cfg = LOG_TYPE_CFG[l.type]||LOG_TYPE_CFG.note;
        const msg = l.message!=null?l.message:(l.content||"");
        const fromTag = (from.id!==node.id) ? `<span style="font-size:9px;color:var(--inkLight)"> · ${esc(from.title)}</span>` : "";
        const editing = S.editLogId===l.id;
        if(editing){
          return `<div class="log"><div class="dot" style="color:${cfg.c}">${cfg.i}</div>
            <div class="body" style="flex:1">
              <input type="text" data-editlog="msg" value="${esc(msg)}" style="width:100%;margin-bottom:6px">
              <div class="flex gap6 aic">
                <input type="date" data-editlog="date" value="${esc(l.date||todayStr())}" style="flex:1">
                <button class="btn btn-primary sm" data-act="editlog-save" data-id="${l.id}" data-from="${from.id}">存</button>
                <button class="btn btn-ghost sm" data-act="editlog-cancel">取消</button>
              </div>
            </div></div>`;
        }
        return `<div class="log"><div class="dot" style="color:${cfg.c}">${cfg.i}</div>
          <div class="body">
            <div class="content" style="font-size:13px;color:var(--ink)">${esc(msg)}</div>
            <div class="meta" style="margin-top:3px">${fmt(l.date)} <span class="tag" style="background:${cfg.bg||'var(--bgMuted)'};color:${cfg.c};font-size:9px;padding:1px 6px">${cfg.label}</span>${fromTag}
              <button class="btn btn-ghost" style="padding:1px 6px;font-size:10px;margin-left:4px" data-act="editlog-start" data-id="${l.id}">✎</button>
              <button class="btn btn-ghost" style="padding:1px 6px;font-size:10px" data-act="editlog-del" data-id="${l.id}" data-from="${from.id}">×</button>
            </div>
          </div></div>`;
      }).join("");

      // logs: only project/portfolio show log entry + history; branch shows history only; work shows nothing
      const showLogEntry = node.type==="project"||node.type==="portfolio"||node.type==="branch";
      const showLogHistory = node.type!=="work";

      const logBlock = showLogHistory ? html`
        <div class="sect">${(node.type==="project"||node.type==="portfolio")?"歷程 Log（含底下各工項/待辦）":"歷程 Log"}</div>
        ${showLogEntry?html`<div class="card" style="padding:13px;margin-bottom:12px">
          <textarea data-det="logText" rows="2" placeholder="記一筆：發生了什麼…">${esc(det.logText)}</textarea>
          <div class="flex gap6 wrap" style="margin-top:8px">
            <button class="btn sm" style="background:var(--mossBg);color:var(--moss)" data-act="addlog" data-type="progress">＋ 進度</button>
            <button class="btn sm" style="background:var(--slateBg);color:var(--slate)" data-act="addlog" data-type="decision">＋ 決策</button>
            <button class="btn sm" style="background:var(--clayBg);color:var(--clay)" data-act="addlog" data-type="blocker">＋ 卡點</button>
            <button class="btn sm" style="background:var(--bgMuted);color:var(--inkMid)" data-act="addlog" data-type="note">＋ 備註</button>
            <button class="btn sm" style="background:var(--bambooBg);color:var(--bamboo)" data-act="addlog" data-type="milestone">＋ 里程碑</button>
          </div>
        </div>`:""}
        ${logsHtml || `<div class="empty">尚無記錄</div>`}` : "";

      tabBody = html`
      <div class="up">
        ${summaryBlock}
        ${maturityControl}
        ${stake}
        ${metaRow}
        ${notesBlock}
        ${logBlock}
      </div>`;
    }
    else {
      // ── 專案樹狀圖: all projects/branches/work under this account/node ──
      const DEPTH_CFG = {
        project: { icon:"◆", c:"var(--slate)" },
        branch:  { icon:"❯", c:"var(--bamboo)" },
        work:    { icon:"▪", c:"var(--clay)" },
      };
      function row(n, depth){
        const isHi = S.highlightId===n.id;
        const dd = effDeadline(n);
        const dc = DEPTH_CFG[n.type]||DEPTH_CFG.work;
        const indent = depth*18;
        const isEditing = S.treeEditId===n.id;
        const titleContent = isEditing
          ? `<input id="tree-edit-input" type="text" value="${esc(n.title)}"
               data-tree-id="${n.id}"
               style="font-size:12px;font-weight:600;flex:1;border:none;border-bottom:2px solid var(--bamboo);background:transparent;padding:1px 0;outline:none;min-width:0">`
          : `<div class="grow" style="min-width:0">
               <div style="font-size:12px;font-weight:${n.type==='project'?'700':n.type==='branch'?'600':'500'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n.type==="branch"&&branchAutoBlocked(S.nodes,n)?"🚧 ":""}${esc(n.title)}</div>
               ${dd?`<div class="sub">${fmt(dd)}</div>`:""}
             </div>`;
        return `
        <div class="node-row" style="position:relative;margin-left:${indent}px;border-left:3px solid ${dc.c};${isHi?'background:var(--bambooBg);box-shadow:0 0 0 2px var(--bamboo) inset':''}">
          <span style="font-size:11px;color:${dc.c};margin-right:4px;flex-shrink:0">${dc.icon}</span>
          ${isEditing
            ? `<div class="flex aic gap6" style="flex:1;min-width:0">${titleContent}</div>`
            : `<div class="flex aic gap4" style="flex:1;min-width:0;cursor:pointer" data-act="tree-edit" data-id="${n.id}">${titleContent}</div>`
          }
          <button class="btn btn-ghost sm" data-act="move-start" data-id="${n.id}" title="搬移" style="padding:2px 7px;flex-shrink:0">⇄</button>
        </div>`;
      }
      let listHtml = "";
      function walkAll(id, depth){
        childrenOf(S.nodes,id).forEach(c=>{
          if(c.type==="project"||c.type==="branch"||c.type==="work"){
            listHtml += row(c, depth);
            walkAll(c.id, depth+1);
          } else {
            walkAll(c.id, depth);
          }
        });
      }
      walkAll(node.id, 0);
      tabBody = html`
      <div class="up">
        <div class="muted" style="font-size:11px;margin-bottom:10px">點項目可編輯，⇄ 可搬移。</div>
        ${listHtml || `<div class="empty">底下還沒有專案/工項/待辦</div>`}
      </div>`;
    }

    // clear highlight after it has rendered once
    if(S.highlightId) setTimeout(()=>{ S.highlightId=null; }, 1200);

    return header + `<div class="pad-wide" style="padding:16px 18px 100px">${tabBody}</div>`;
  }

  /* ─── IMPORT ───────────────────────────────────────────────────────────── */
  function parseRows(text){
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if(!lines.length) return { rows:[], cols:[] };
    const delim = lines[0].indexOf("\t")>-1 ? "\t" : ",";
    const split = l => l.split(delim).map(s=>s.trim());
    let cols, dataLines;
    const first = split(lines[0]).map(s=>s.toLowerCase());
    const hasHeader = first.indexOf("title")>-1 || first.indexOf("type")>-1;
    if(hasHeader){ cols = first; dataLines = lines.slice(1); }
    else { cols = ["title","type","parenttitle","summary"]; dataLines = lines; } // legacy 4-col
    const rows = dataLines.map(l=>{
      const c = split(l);
      const o = {};
      cols.forEach((name,i)=>{ o[name] = c[i]!=null ? c[i] : ""; });
      return {
        id:           o["id"]||"",
        type:         (o["type"]||"work").toLowerCase(),
        parentType:   o["parenttype"]||"",
        parentId:     o["parentid"]||"",
        parentTitle:  o["parenttitle"]||"",
        title:        o["title"]||"",
        summary:      o["summary"]||"",
        portfolioState:o["portfoliostate"]||"",
        projectMode:  o["projectmode"]||"",
        executionStage:o["executionstage"]||"",
        workStatus:   o["workstatus"]||"",
        deadline:     o["deadline"]||"",
        firstSuccessEvent:o["firstsuccessevent"]||"",
        owner:        o["owner"]||"",
        channel:      o["channel"]||"",
        stakeholders: o["stakeholders"]||"",
        lastProgress: o["lastprogress"]||"",
        progressSignal:o["progresssignal"]||"",
        tags:         o["tags"]||"",
      };
    }).filter(r=>r.title);
    return { rows, cols };
  }
  function computeReport(){
    const ns = S.nodes;
    const { rows } = parseRows(S.importRaw);
    const idxTitle = new Map(ns.map(n=>[n.title.trim(), n]));
    // build an id index that also includes ids appearing earlier in this same import batch
    const importIds = new Set(rows.map(r=>r.id).filter(Boolean));
    const existingIds = new Set(ns.map(n=>n.id));
    const effMode = ns.length===0 ? "append" : S.importMode; // first-run = append
    const created=[], updated=[], merged=[], ignored=[], conflicts=[];
    rows.forEach(r=>{
      // match existing node: prefer id, fall back to title
      const exById = r.id && existingIds.has(r.id) ? ns.find(n=>n.id===r.id) : null;
      const exByTitle = idxTitle.get(r.title);
      const ex = exById || exByTitle;
      if(ex){
        if(effMode==="append") ignored.push(r);
        else updated.push(Object.assign({},r,{_id:ex.id}));
        return;
      }
      if(!ALLOWED_PARENT[r.type]){ conflicts.push(Object.assign({},r,{_why:"unknown type 未知類型"})); return; }
      // resolve parent: by parentId (existing OR same-batch), else by parentTitle
      let parentRef = null;
      if(r.parentId){
        if(existingIds.has(r.parentId)) parentRef = {kind:"id", val:r.parentId};
        else if(importIds.has(r.parentId)) parentRef = {kind:"batchId", val:r.parentId};
      }
      if(!parentRef && r.parentTitle){
        const p = idxTitle.get(r.parentTitle);
        if(p) parentRef = {kind:"id", val:p.id};
      }
      if(r.type!=="portfolio" && r.type!=="capture" && !parentRef){
        conflicts.push(Object.assign({},r,{_why:"parent not found 找不到父節點"})); return;
      }
      created.push(Object.assign({},r,{_parent:parentRef}));
    });
    S.importReport = { created, updated, merged, ignored, conflicts, mode:effMode };
    render();
  }
  function applyImport(){
    const rep = S.importReport; if(!rep) return;
    const ns = S.nodes;
    // map original import-id → freshly generated id, so same-batch parents resolve
    const idMap = {};
    rep.created.forEach(r=>{ idMap[r.id || ("_"+r.title)] = r.id || uid(r.type); });

    function resolveParentId(pr){
      if(!pr) return null;
      if(pr.kind==="id") return pr.val;            // existing node id
      if(pr.kind==="batchId") return idMap[pr.val] || null; // same-batch
      return null;
    }
    function parseStake(s){
      if(!s) return [];
      return String(s).split(";").filter(Boolean).map(name=>({name,role:"partner",channel:""}));
    }
    const additions = rep.created.map(r=>{
      const newId = idMap[r.id || ("_"+r.title)];
      const parentId = resolveParentId(r._parent);
      const parent = parentId ? (byId(ns,parentId) || null) : null;
      const parentType = parent ? parent.type
        : (r.parentType || ({project:"portfolio",branch:"project",work:"branch",portfolio:null}[r.type] || null));
      const base = { id:newId, type:r.type,
        parentType: r.type==="portfolio" ? null : parentType,
        parentId: r.type==="portfolio" ? null : parentId,
        title:r.title, summary:r.summary||"",
        tags: r.tags ? String(r.tags).split(";").filter(Boolean) : [],
        lastProgress: r.lastProgress || todayStr(),
        progressSignal: r.progressSignal || "import",
        lastUpdated: todayStr(),
        logs:[{id:uid("log"),date:todayStr(),signal:"import",content:"Imported 匯入"}], attachments:[] };
      if(r.type==="portfolio"){
        base.portfolioState = r.portfolioState || "active";
        base.projectMode = r.projectMode || "explore";
        // portfolios don't have a stakeholders field — fold any provided names into tags
        if(r.stakeholders){
          const extra = String(r.stakeholders).split(";").filter(Boolean);
          base.tags = base.tags.concat(extra.filter(x=>base.tags.indexOf(x)<0));
        }
      }
      if(r.type==="project"||r.type==="branch"){
        base.executionStage = r.executionStage || "ready";
        base.firstSuccessEvent = r.firstSuccessEvent || "";
        base.deadline = r.deadline || null;
        if(r.type==="branch") base.channel = r.channel || "";
        if(r.type==="project") base.stakeholders = parseStake(r.stakeholders);
      }
      if(r.type==="work"){
        base.workStatus = r.workStatus || "todo";
        base.owner = r.owner || "";
        base.firstSuccessEvent = r.firstSuccessEvent || "";
        base.deadline = r.deadline || null;
      }
      return base;
    });
    let next = ns.slice();
    // updates: merge richer fields when present (never blanks out existing)
    rep.updated.forEach(u=>{
      next = next.map(n=>{
        if(n.id!==u._id) return n;
        const m = Object.assign({}, n);
        if(u.summary) m.summary = u.summary;
        if(u.portfolioState) m.portfolioState = u.portfolioState;
        if(u.projectMode) m.projectMode = u.projectMode;
        if(u.executionStage) m.executionStage = u.executionStage;
        if(u.workStatus) m.workStatus = u.workStatus;
        if(u.deadline) m.deadline = u.deadline;
        if(u.firstSuccessEvent) m.firstSuccessEvent = u.firstSuccessEvent;
        if(u.owner) m.owner = u.owner;
        if(u.channel) m.channel = u.channel;
        if(u.tags) m.tags = String(u.tags).split(";").filter(Boolean);
        m.lastUpdated = todayStr();
        return m;
      });
    });
    next = next.concat(additions);
    S.nodes = next;
    S.importReport = null; S.importRaw = "";
    S.view = "portfolio";
    render();
    maybeSync("import");
  }
  function viewImport(){
    const rep = S.importReport;
    let reportBlock = "";
    if(rep){
      const conflicts = rep.conflicts.length ? `
        <div style="margin-top:10px;background:var(--clayBg);border-radius:var(--rsm);padding:10px 12px">
          <div style="font-size:11px;font-weight:700;color:var(--clay);margin-bottom:4px">conflicts 衝突 (${rep.conflicts.length})</div>
          ${rep.conflicts.map(c=>`<div style="font-size:11px;color:var(--inkMid)">${esc(c.title)} — ${esc(c._why)}</div>`).join("")}
        </div>` : "";
      const willCreate = rep.created.length ? `
        <div style="margin-top:10px"><div class="muted" style="font-size:10px;margin-bottom:4px">will create:</div>
          ${rep.created.map(c=>`<div style="font-size:11px;color:var(--inkMid)">${(TYPE_CFG[c.type]||{i:"?"}).i} ${esc(c.title)} ${c._parent?"→ under parent":""}</div>`).join("")}
        </div>` : "";
      // First-run rule: empty workspace never blocks on Preview.
      const isEmpty = S.nodes.length === 0;
      const effectiveMode = isEmpty ? "append" : S.importMode;
      const nothingToDo = (rep.created.length===0 && rep.updated.length===0);
      const applyDisabled = (!isEmpty && S.importMode==="preview") || nothingToDo;
      const applyLabel = nothingToDo
        ? "Nothing to import 無可匯入"
        : (isEmpty
            ? `Confirm Import 確認匯入 (${rep.created.length})`
            : (S.importMode==="preview"
                ? "Preview only — pick Merge or Append below 預覽中，請於下方選 Merge / Append"
                : "Apply Import 套用匯入"));
      reportBlock = html`
      <div class="up" style="margin-top:16px">
        <div class="card" style="padding:16px">
          <span class="label">Import Report（mode: ${effectiveMode}）</span>
          <div class="row2" style="gap:8px 16px;margin-top:8px">
            <div><span class="label">created 新增</span><div style="font-size:12px;color:var(--inkMid)">${rep.created.length}</div></div>
            <div><span class="label">updated 更新</span><div style="font-size:12px;color:var(--inkMid)">${rep.updated.length}</div></div>
            <div><span class="label">merged 合併</span><div style="font-size:12px;color:var(--inkMid)">${rep.merged.length}</div></div>
            <div><span class="label">ignored 略過</span><div style="font-size:12px;color:var(--inkMid)">${rep.ignored.length}</div></div>
          </div>
          ${conflicts}${willCreate}
          ${(!isEmpty && S.importMode==="preview" && !nothingToDo) ? `
            <div class="seg mt14">
              <button data-act="import-mode" data-mode="merge" style="background:var(--bgMuted);color:var(--inkMid)">Use Merge 用合併</button>
              <button data-act="import-mode" data-mode="append" style="background:var(--bgMuted);color:var(--inkMid)">Use Append 用新增</button>
            </div>` : ""}
          <button class="btn btn-primary full mt14" data-act="import-apply" ${applyDisabled?"disabled":""}>
            ${applyLabel}
          </button>
        </div>
      </div>`;
    }
    const isEmptyWs = S.nodes.length === 0;
    const modeSelector = isEmptyWs ? `
      <div class="note-muted" style="border-radius:var(--r);padding:10px 12px;margin-bottom:14px;font-size:11px">
        First import — mode is <b>Append 新增</b> automatically. 首次匯入：自動使用「新增」模式。
      </div>` : `
      <div class="seg mb14">
        ${[["preview","Preview Diff 預覽"],["merge","Merge 合併"],["append","Append 新增"]].map(([m,t])=>`
          <button data-act="import-mode" data-mode="${m}" class="${S.importMode===m?"on":""}" style="${S.importMode===m?"background:var(--ink);color:#fff":""}">${t}</button>`).join("")}
      </div>`;
    return html`
    ${topbar("Import 匯入","Import › Merge › Export · never overwrite")}
    <div class="pad">
      <div class="note-info" style="border-radius:var(--r);padding:12px 14px;margin-bottom:16px;font-size:11px;line-height:1.6">
        Load an Excel/CSV file or paste rows. Supports the <b>full schema</b> (id, type, parentId, …) or the <b>short form</b> (title, type, parentTitle, summary). Import never replaces existing nodes.
        可載入 Excel/CSV 或貼上。支援<b>完整欄位</b>（id, type, parentId…）或<b>簡式</b>（title, type, parentTitle, summary）。匯入不會覆蓋既有資料。
      </div>
      ${modeSelector}
      <div class="drop mb14" data-act="pickfile">
        <div style="font-size:20px;margin-bottom:4px">⤓</div>
        <div style="font-size:12px;color:var(--inkMid)">Load Excel / CSV file 載入檔案</div>
        <input type="file" accept=".xlsx,.xls,.csv,.txt" id="importfile" style="display:none">
      </div>
      <div class="field"><span class="label">Or paste 或貼上 (CSV/TSV)</span>
        <textarea data-imp="raw" rows="5" placeholder="title,type,parentTitle,summary&#10;新工作項,work,CD8260 背面 LOGO 版,測試">${esc(S.importRaw)}</textarea></div>
      <button class="btn btn-primary full" data-act="import-compute" ${!S.importRaw.trim()?"disabled":""}>Compute Diff 計算差異</button>
      ${reportBlock}
    </div>`;
  }

  /* ─── SETTINGS (sync config) ───────────────────────────────────────────── */
  function viewSettings(){
    const connected = !!S.syncUrl;
    return html`
    ${topbar("設定 Settings","Google Sheets 同步")}
    <div class="pad">
      <div class="sect">雲端同步 Cloud Sync</div>
      <div class="note-info" style="border-radius:var(--r);padding:12px 14px;margin-bottom:14px;font-size:11px;line-height:1.7">
        把資料同步到你自己的 Google 試算表，跨裝置接續工作。同步是<b>同步層</b>，不是真相來源——Excel 匯出仍是備份。
        Sync to your own Google Sheet for cross-device continuity. Sync is a layer, not the source of truth.
      </div>

      <div class="card" style="padding:14px;margin-bottom:14px">
        <div class="field">
          <span class="label">Apps Script Web App 網址 URL</span>
          <input type="text" data-set="url" value="${esc(S.settingsUrlDraft||S.syncUrl||"")}" placeholder="https://script.google.com/macros/s/…/exec">
        </div>
        <div class="field">
          <span class="label">這台裝置名稱 Device name</span>
          <input type="text" data-set="dev" value="${esc(S.settingsDevDraft||S.syncDevice||"")}" placeholder="iPhone / 筆電 Laptop">
        </div>
        <div class="flex gap8">
          <button class="btn btn-secondary" style="flex:1" data-act="sync-save">儲存設定</button>
          ${connected?`<button class="btn btn-ghost" style="flex:1" data-act="sync-clear">清除</button>`:""}
        </div>
      </div>

      ${connected?`
      <div class="card" style="padding:14px;margin-bottom:14px">
        <div class="flex between aic mb10">
          <span class="label" style="margin:0">狀態 Status</span>
          <span style="font-size:11px;color:${S.syncStatus==='error'?'var(--clay)':'var(--moss)'}">${esc(syncLabel())}</span>
        </div>
        <div class="flex gap8">
          <button class="btn btn-moss" style="flex:1" data-act="sync-push">⤴ 上傳到雲端</button>
          <button class="btn btn-slate" style="flex:1" data-act="sync-pull">⤵ 從雲端載入</button>
        </div>
        <div class="muted" style="font-size:10px;margin-top:8px;line-height:1.6">
          上傳＝把這台的資料存到雲端；載入＝把雲端資料抓下來覆蓋這台。單人使用，後存的為準。
        </div>
      </div>`:""}

      <div class="sect">怎麼設定？ Setup</div>
      <div class="card" style="padding:14px">
        <ol style="margin:0;padding-left:18px;font-size:12px;color:var(--inkMid);line-height:1.9">
          <li>開一個新的 Google 試算表（專給 PMO OS）</li>
          <li>擴充功能 → Apps Script，貼上我給你的後端程式碼</li>
          <li>部署 → 新增部署 → 類型「網頁應用程式」</li>
          <li>「誰可以存取」選「<b>任何人</b>」→ 部署 → 複製網址</li>
          <li>把網址貼到上面欄位 → 儲存設定 → 按「上傳到雲端」</li>
        </ol>
        <div class="muted" style="font-size:10px;margin-top:10px">跟你估價系統同樣的 Apps Script 做法。</div>
      </div>
    </div>`;
  }

  /* ─── sync status bar (shown atop Daily) ───────────────────────────────── */
  function syncBar(){
    if(!S.syncUrl) return "";
    const err = S.syncStatus==="error";
    return `<div class="flex between aic" style="padding:6px 18px;background:${err?'var(--clayBg)':'var(--bgMuted)'};font-size:10px;color:${err?'var(--clay)':'var(--inkMid)'};border-bottom:1px solid var(--border)">
      <span>☁ ${esc(syncLabel())}</span>
      <button class="btn btn-ghost" style="padding:2px 8px;font-size:10px" data-act="sync-push">立即同步</button>
    </div>`;
  }

  /* ─── EXPORT ───────────────────────────────────────────────────────────── */
  function buildSnapshot(ns){
    return {
      active: ns.filter(n=>n.type==="work"&&n.workStatus!=="done"&&!n.mergeIntoId),
      inbox: ns.filter(n=>n.type==="portfolio"&&n.portfolioState==="inbox"),
      blocked: ns.filter(n=>(n.type==="project"||n.type==="branch")&&n.executionStage==="blocked"&&!n.mergeIntoId),
      stale: ns.filter(isStale),
      portfolios: ns.filter(n=>n.type==="portfolio"&&!n.mergeIntoId),
    };
  }
  function snapshotMarkdown(ns){
    const s = buildSnapshot(ns);
    const line = n => `- ${n.title}${n.deadline?` (due ${fmt(n.deadline)})`:""}${isStale(n)?` ⏱${daysSince(n.lastProgress)}d`:""}`;
    const sec = (title, arr) => [`## ${title}`].concat(arr.length?arr.map(line):["- none"]).join("\n");
    return [
      `# Kikō PMO Snapshot — ${todayStr()}`, "",
      sec("Today's Active (work items)", s.active), "",
      sec("Inbox", s.inbox), "",
      sec("Blocked", s.blocked), "",
      sec("Stale > 7d", s.stale), "",
      "## Suggested Merge", "- (review captures with ≥2 shared signals)", "",
      "## Portfolio Summary",
      s.portfolios.map(p=>`- **${p.title}** — ${p.portfolioState} · ${p.projectMode}`).join("\n"), "",
      "## Next Actions",
      s.active.slice(0,5).map(w=>`- ${w.title} → ${w.owner||"?"}`).join("\n"),
    ].join("\n");
  }
  function ensureXLSX(){
    if(typeof XLSX==="undefined"){ alert("Excel library not loaded (offline?). CSV/Markdown still work."); return false; }
    return true;
  }
  function exportRawExcel(){
    if(!ensureXLSX()) return;
    const ns = S.nodes;
    const flat = ns.map(n=>({
      id:n.id, type:n.type, parentType:n.parentType||"", parentId:n.parentId||"",
      title:n.title, summary:n.summary||"",
      portfolioState:n.portfolioState||"", projectMode:n.projectMode||"",
      executionStage:n.executionStage||"", workStatus:n.workStatus||"",
      deadline:n.deadline||"", firstSuccessEvent:n.firstSuccessEvent||"",
      owner:n.owner||"", channel:n.channel||"",
      stakeholders:(n.stakeholders||[]).map(s=>s.name).join(";"),
      lastProgress:n.lastProgress||"", progressSignal:n.progressSignal||"",
      tags:(n.tags||[]).join(";"),
      mergeIntoId:n.mergeIntoId||"",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flat), "nodes_import");
    XLSX.writeFile(wb, `kiko-nodes-${todayStr()}.xlsx`);
  }
  function exportSnapshotExcel(){
    if(!ensureXLSX()) return;
    const s = buildSnapshot(S.nodes);
    const wb = XLSX.utils.book_new();
    const sheet = (arr,cols)=>XLSX.utils.json_to_sheet(arr.length?arr.map(cols):[{}]);
    XLSX.utils.book_append_sheet(wb, sheet(s.active, n=>({Title:n.title,Owner:n.owner||"",Status:n.workStatus,Deadline:n.deadline||""})), "Today Active");
    XLSX.utils.book_append_sheet(wb, sheet(s.inbox, n=>({Title:n.title,Mode:n.projectMode})), "Inbox");
    XLSX.utils.book_append_sheet(wb, sheet(s.blocked, n=>({Title:n.title,Stage:n.executionStage})), "Blocked");
    XLSX.utils.book_append_sheet(wb, sheet(s.stale, n=>({Title:n.title,IdleDays:daysSince(n.lastProgress)})), "Stale");
    XLSX.utils.book_append_sheet(wb, sheet(s.portfolios, n=>({Title:n.title,State:n.portfolioState,Mode:n.projectMode})), "Portfolio");
    XLSX.writeFile(wb, `kiko-pmo-snapshot-${todayStr()}.xlsx`);
  }
  function downloadMarkdown(){
    const md = snapshotMarkdown(S.nodes);
    const blob = new Blob([md], {type:"text/markdown"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `kiko-pmo-snapshot-${todayStr()}.md`; a.click();
    URL.revokeObjectURL(url);
  }
  function viewExport(){
    return html`
    ${topbar("Export 匯出","raw data + PMO snapshot")}
    <div class="pad">
      <div class="sect">Raw Data 原始資料</div>
      <div class="card mb14" style="padding:14px">
        <div style="font-size:12px;color:var(--inkMid);margin-bottom:10px">Full node tree as a flat Excel sheet (re-importable). 完整節點樹（可再匯入）。</div>
        <button class="btn btn-secondary full" data-act="export-raw">⤓ Export Nodes.xlsx</button>
      </div>
      <div class="sect">PMO Snapshot 戰情快照</div>
      <div class="card" style="padding:14px">
        <div style="font-size:12px;color:var(--inkMid);margin-bottom:10px">Curated review package for external PMO discussion (e.g. ChatGPT). 給外部 PMO 討論用。</div>
        <div class="flex gap8 mb10">
          <button class="btn btn-moss sm" style="flex:1" data-act="export-snap-xlsx">⤓ Excel</button>
          <button class="btn btn-moss sm" style="flex:1" data-act="export-snap-md">⤓ Markdown</button>
          <button class="btn btn-ghost sm" style="flex:1" data-act="toggle-md">${S.mdPreview?"Hide":"Preview"}</button>
        </div>
        ${S.mdPreview?`<pre class="md">${esc(snapshotMarkdown(S.nodes))}</pre>`:""}
      </div>
    </div>`;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     EVENT BINDING (delegation)
     ═══════════════════════════════════════════════════════════════════════ */
  function bind(){
    const root = app();

    // click delegation
    root.onclick = e => {
      if(e.target.closest("a.wlink")){ return; } // let the link open in a new tab
      const t = e.target.closest("[data-act],[data-cap-pick]");
      if(!t) return;
      // segmented brief pickers
      if(t.hasAttribute("data-cap-pick")){
        cap[t.getAttribute("data-cap-pick")] = t.getAttribute("data-val");
        render(); return;
      }
      const act = t.getAttribute("data-act");
      switch(act){
        case "login": S.role=t.getAttribute("data-role"); S.view="daily"; render(); break;
        case "logout": S.role=null; S.selectedId=null; try{localStorage.removeItem(LS_ROLE);}catch(_){} render(); break;
        case "seed-confirm": S.nodes=JSON.parse(JSON.stringify(SEED_NODES)).map(migrateNode); render(); break;
        case "seed-skip": S.nodes=[]; render(); break;
        case "nav": { const v=t.getAttribute("data-view");
          if((v==="capture"||v==="import")&&S.role==="factory") return;
          S.selectedId=null; S.view=v; render(); break; }
        case "open": S.selectedId=t.getAttribute("data-id"); S.view="detail"; S.detailTab="info"; det.showTransform=false; render(); break;
        case "open-from-daily": openFromDaily(t.getAttribute("data-id")); break;
        case "back": S.selectedId=null; S.view="daily"; render(); break;
        case "tab": S.detailTab=t.getAttribute("data-tab"); render(); break;
        case "toggle": { const id=t.getAttribute("data-id"); S.expanded[id]=!S.expanded[id]; render(); e.stopPropagation(); break; }
        case "pf": S.pfFilter=t.getAttribute("data-state"); render(); break;
        case "workstatus": setWorkStatus(t.getAttribute("data-id"), t.getAttribute("data-status")); break;
        case "toggle-advanced": S.advanced=!S.advanced; render(); break;
        case "pin": doPin(t.getAttribute("data-id")); break;
        case "cycle-priority": cyclePriority(t.getAttribute("data-id")); break;
        case "w-done": wDone(t.getAttribute("data-id")); break;
        case "w-delay": wDelay(t.getAttribute("data-id")); break;
        case "w-more": wMore(t.getAttribute("data-id")); break;
        case "more-save": wMoreSave(); break;
        case "more-cancel": S.moreFor=null; render(); break;
        case "move-start": S.moveFor=t.getAttribute("data-id"); render(); break;
        case "note-add": noteAdd(); break;
        case "note-del": noteDel(+t.getAttribute("data-idx")); break;
        case "move-cancel": S.moveFor=null; render(); break;
        case "move-to": doMove(t.getAttribute("data-pid")); break;
        case "sync-save": syncSaveSettings(); break;
        case "sync-clear": syncClearSettings(); break;
        case "sync-push": syncPush("manual"); break;
        case "sync-pull": if(confirm("從雲端載入會以雲端資料為準，覆蓋這台未上傳的變更。確定？")) syncPull({alert:true}); break;
        case "set-maturity": setMaturity(t.getAttribute("data-val")); break;
        case "toggle-transform": det.showTransform=!det.showTransform; render(); break;
        case "transform": doTransform(t.getAttribute("data-to"), t.getAttribute("data-freeze")==="1"); break;
        case "addlog": addLog(t.getAttribute("data-type")); break;
        case "editlog-start": S.editLogId=t.getAttribute("data-id"); S.editLogMsg=""; S.editLogDate=""; render(); break;
        case "editlog-cancel": S.editLogId=null; render(); break;
        case "editlog-save": editLogSave(t.getAttribute("data-id"), t.getAttribute("data-from")); break;
        case "editlog-del": editLogDel(t.getAttribute("data-id"), t.getAttribute("data-from")); break;
        case "deadline-clear": { const node=byId(S.nodes,S.selectedId); if(node){ updateNode(node.id,n=>{n.deadline=null;return n;}); render(); maybeSync("deadline"); } break; }
        case "tree-edit": S.treeEditId=t.getAttribute("data-id"); render(); setTimeout(()=>{ const el=document.getElementById("tree-edit-input"); if(el){el.focus();el.select();} },30); break;
        case "title-edit": S.editTitleId=t.getAttribute("data-id"); render(); setTimeout(()=>{ const el=document.getElementById("title-edit-input"); if(el){el.focus();el.select();} },30); break;
        case "summary-save": summarySave(); break;
        case "node-delete": nodeDelete(t.getAttribute("data-id")); break;
        case "cap-commit": capCommit(); break;
        case "cap-newaccount": capNewAccount(); break;
        case "cap-pickaccount": cap.accountId=t.getAttribute("data-id"); cap.pick=null; render(); break;
        case "cap-clearaccount": cap.accountId=null; cap.pick=null; cap.title=""; cap.nexts=[]; cap.logText=""; render(); break;
        case "cap-rmimg": { const i=+t.getAttribute("data-idx"); cap.images.splice(i,1); render(); break; }
        case "cap-pick": { cap.pick={ mode:t.getAttribute("data-mode"), parentId:t.getAttribute("data-pid")||null }; cap.title=""; cap.nexts=[]; render(); break; }
        case "cap-addnext": { const v=(cap.title||"").trim(); if(v){ cap.nexts.push(v); cap.title=""; } render(); break; }
        case "cap-rmnext": { const i=+t.getAttribute("data-idx"); cap.nexts.splice(i,1); render(); break; }
        case "pickimg": document.getElementById("capimg").click(); break;
        case "pickfile": document.getElementById("importfile").click(); break;
        case "import-mode": S.importMode=t.getAttribute("data-mode"); S.importReport=null; render(); break;
        case "import-compute": computeReport(); break;
        case "import-apply": applyImport(); break;
        case "export-raw": exportRawExcel(); break;
        case "export-snap-xlsx": exportSnapshotExcel(); break;
        case "export-snap-md": downloadMarkdown(); break;
        case "toggle-md": S.mdPreview=!S.mdPreview; render(); break;
        case "noop": break;
      }
    };

    // input delegation (capture form, detail log, import) — keep state without full re-render where possible
    root.oninput = e => {
      const el = e.target;
      if(el.hasAttribute("data-cap")){ cap[el.getAttribute("data-cap")] = el.value;
        // re-render only when target changes structure (parent options differ per target)
        if(el.getAttribute("data-cap")==="target"){ cap.parentId=""; render(); return; }
        if(el.getAttribute("data-cap")==="newAccountName"){ const b=root.querySelector('[data-act="cap-newaccount"]'); if(b) b.disabled=!el.value.trim(); return; }
        // otherwise just refresh the commit button's disabled state live (preserve focus)
        refreshCapCommit();
        return;
      }
      if(el.hasAttribute("data-det")){ det[el.getAttribute("data-det")] = el.value; return; }
      if(el.hasAttribute("data-more")){ const k=el.getAttribute("data-more"); if(k==="title")S.moreTitle=el.value; if(k==="dday")S.moreDday=el.value; return; }
      if(el.hasAttribute("data-note")){ S.noteDraft=el.value; return; }
      if(el.hasAttribute("data-editlog")){ const k=el.getAttribute("data-editlog"); if(k==="msg")S.editLogMsg=el.value; if(k==="date")S.editLogDate=el.value; return; }
      if(el.hasAttribute("data-set")){ const k=el.getAttribute("data-set"); if(k==="url")S.settingsUrlDraft=el.value; if(k==="dev")S.settingsDevDraft=el.value; return; }
      if(el.hasAttribute("data-imp")){ S.importRaw = el.value;
        const btn = root.querySelector('[data-act="import-compute"]');
        if(btn) btn.disabled = !S.importRaw.trim();
        return;
      }
    };
    // selects fire 'change', not 'input', in some browsers — mirror the handler
    root.addEventListener("change", e => {
      const el = e.target;
      if(el.hasAttribute("data-act-deadline")){
        const id = el.getAttribute("data-act-deadline");
        const val = el.value || null;
        updateNode(id, n=>{ n.deadline=val; return n; });
        render(); maybeSync("deadline");
        return;
      }
      if(el.hasAttribute("data-cap")){ cap[el.getAttribute("data-cap")] = el.value;
        if(el.getAttribute("data-cap")==="target"){ cap.parentId=""; render(); return; }
        refreshCapCommit();
      }
    });
    // title inline edit: Enter = save, Escape = cancel, blur = save
    root.addEventListener("keydown", e=>{
      if(e.target.id==="title-edit-input"){
        if(e.key==="Enter"){ e.preventDefault(); titleSave(S.editTitleId); }
        if(e.key==="Escape"){ S.editTitleId=null; render(); }
      }
      if(e.target.id==="tree-edit-input"){
        if(e.key==="Enter"){ e.preventDefault(); treeTitleSave(); }
        if(e.key==="Escape"){ S.treeEditId=null; render(); }
      }
    });
    root.addEventListener("blur", e=>{
      if(e.target.id==="title-edit-input"){ titleSave(S.editTitleId); }
      if(e.target.id==="tree-edit-input"){ treeTitleSave(); }
    }, true);
    root.onchange = e => {
      const el = e.target;
      if(el.hasAttribute("data-cap-check")){ cap[el.getAttribute("data-cap-check")] = el.checked; render(); return; }
      if(el.id==="capimg"){ handleCapImg(el.files); return; }
      if(el.id==="importfile"){ handleImportFile(el.files[0]); return; }
    };
    // Chinese IME: 'input' may not fire during composition — capture the final value
    root.addEventListener("compositionend", e=>{
      const el=e.target;
      if(el.hasAttribute("data-cap")){ cap[el.getAttribute("data-cap")] = el.value; refreshCapCommit(); }
      if(el.hasAttribute("data-det")){ det[el.getAttribute("data-det")] = el.value; }
      if(el.hasAttribute("data-note")) S.noteDraft=el.value;
    });
  }

  /* ─── actions ──────────────────────────────────────────────────────────── */
  function setWorkStatus(id, s){
    S.nodes = S.nodes.map(n=>n.id===id?Object.assign({},n,{workStatus:s,lastUpdated:todayStr(),lastProgress:todayStr(),progressSignal:"manual"}):n);
    render();
  }
  function updateNode(id, fn){
    S.nodes = S.nodes.map(n=>n.id===id?fn(Object.assign({},n)):n);
  }
  function doPin(id){
    updateNode(id, n=>{ n.tags=togglePin(n); return n; });
    render();
  }
  // Daily → Project deep link: open the owning project's detail, branch tab, highlight the work
  function openFromDaily(workId){
    const n = byId(S.nodes, workId);
    const pid = n ? ownerProjectId(n, S.nodes) : null;
    if(pid){
      S.selectedId = pid; S.view="detail"; S.detailTab="branch"; S.highlightId = workId;
    } else {
      // leaf branch/project with no project ancestor → open itself
      S.selectedId = workId; S.view="detail"; S.detailTab = n&&n.type==="project"?"branch":"info"; S.highlightId = workId;
    }
    det.showTransform=false;
    render();
  }
  function noteAdd(){
    const node = byId(S.nodes, S.selectedId); if(!node) return;
    const txt=(S.noteDraft||"").trim(); if(!txt) return;
    if(getNotes(node).length>=5) return;
    updateNode(node.id, n=>{ n.tags=(n.tags||[]).concat("備註:"+txt); return n; });
    S.noteDraft="";
    render(); maybeSync("note");
  }
  function noteDel(idx){
    const node = byId(S.nodes, S.selectedId); if(!node) return;
    const notes=getNotes(node); if(idx<0||idx>=notes.length) return;
    const target="備註:"+notes[idx];
    updateNode(node.id, n=>{ let removed=false; n.tags=(n.tags||[]).filter(x=>{ if(!removed&&x===target){removed=true;return false;} return true; }); return n; });
    render(); maybeSync("note");
  }
  function doMove(newParentId){
    const node = byId(S.nodes, S.moveFor); if(!node) return;
    const np = byId(S.nodes, newParentId); if(!np) return;
    const now = todayStr();
    S.nodes = S.nodes.map(n=> n.id===node.id ? Object.assign({},n,{
      parentId:newParentId, parentType:np.type, lastUpdated:now
    }) : n);
    S.moveFor=null;
    render();
    maybeSync("move");
  }
  // ✅ 完成 — mark done, advance progress, clear blocker tag, suggest downstream OR auto-advance
  function wDone(id){
    const node = byId(S.nodes, id);
    const title = node ? node.title : "";
    updateNode(id, n=>{
      if(n.type==="work"){ n.workStatus="done"; }
      else { n.executionStage="complete"; }
      n.lastUpdated=todayStr(); n.lastProgress=todayStr(); n.progressSignal="manual";
      n.tags=(n.tags||[]).filter(x=>x!=="⏸延後"); // clear deferred flag
      // only completion auto-logs; content-primary (the item title), status as type
      n.logs=(n.logs||[]).concat(mkLog("milestone","完成："+title));
      return n;
    });
    render();
    maybeSync("done");
  }
  // ⏸ 延後 — push D-DAY by 7 days (works for dated and undated). Edit exact date in Portfolio.
  function wDelay(id){
    updateNode(id, n=>{
      const base = effDeadline(n) ? new Date(effDeadline(n)) : new Date(createdDate(n)+ "T00:00:00");
      const d = new Date(base.getTime() + 7*24*3600*1000);
      const iso = d.toISOString().slice(0,10);
      // store on node.deadline if it had one, else as DDAY tag
      if(n.deadline) n.deadline = iso;
      n.tags = setTagKVlocal(n.tags, TAG_DDAY, iso);
      // mark deferred (drives auto-blocked on the parent 工項)
      if((n.tags||[]).indexOf("⏸延後")<0) n.tags.push("⏸延後");
      n.lastUpdated=todayStr();
      return n;
    });
    render();
    maybeSync("delay");
  }
  function setTagKVlocal(tags, prefix, value){
    tags=(tags||[]).filter(x=>x.indexOf(prefix)!==0);
    if(value) tags.push(prefix+value);
    return tags;
  }
  // ➕ 做更多 — open simple popup to add ONE new 待辦 under the SAME 工項 (parent branch)
  function wMore(id){
    const node = byId(S.nodes, id);
    // target 工項 = the branch this work belongs to; if the card itself is a branch, use it
    let branchId = null;
    if(node){
      if(node.type==="work") branchId = node.parentId;
      else if(node.type==="branch") branchId = node.id;
      else branchId = node.parentId;
    }
    S.moreFor = branchId;
    S.moreTitle = ""; S.moreDday = "";
    render();
  }
  function wMoreSave(){
    const branchId = S.moreFor; if(!branchId) return;
    const title=(S.moreTitle||"").trim(); if(!title){ S.moreFor=null; render(); return; }
    const now=todayStr();
    const tags = S.moreDday ? [TAG_DDAY+S.moreDday] : [];
    S.nodes = S.nodes.concat({
      id:uid("wk"), type:"work", parentType:"branch", parentId:branchId, title,
      summary:"", workStatus:"todo", owner:"", firstSuccessEvent:"", deadline:S.moreDday||null,
      tags, lastProgress:now, progressSignal:"manual", lastUpdated:now,
      logs:[], attachments:[]
    });
    S.moreFor=null; S.moreTitle=""; S.moreDday="";
    render();
    maybeSync("more");
  }
  function setMaturity(val){
    const node = byId(S.nodes, S.selectedId); if(!node) return;
    let upd;
    if(node.type==="portfolio") upd={portfolioState:val,lastUpdated:todayStr()};
    else if(node.type==="work") upd={workStatus:val,lastUpdated:todayStr(),lastProgress:todayStr(),progressSignal:"manual"};
    else upd={executionStage:val,lastUpdated:todayStr(),lastProgress:todayStr(),progressSignal:"manual"};
    S.nodes = S.nodes.map(n=>n.id===node.id?Object.assign({},n,upd):n);
    render();
  }
  function summarySave(){
    const node = byId(S.nodes, S.selectedId); if(!node) return;
    const el = document.querySelector('[data-det="summaryDraft"]');
    const txt = el ? el.value.trim() : (det.summaryDraft||"").trim();
    S.nodes = S.nodes.map(n=>n.id===node.id?Object.assign({},n,{summary:txt,lastUpdated:todayStr()}):n);
    render(); maybeSync("summary");
    toast("摘要已儲存");
  }
  function titleSave(id){
    const el = document.getElementById("title-edit-input");
    const txt = el ? el.value.trim() : "";
    if(!txt){ S.editTitleId=null; render(); return; }
    S.nodes = S.nodes.map(n=>n.id===id?Object.assign({},n,{title:txt,lastUpdated:todayStr()}):n);
    S.editTitleId=null;
    render(); maybeSync("rename");
  }
  function treeTitleSave(){
    const id = S.treeEditId; if(!id) return;
    const el = document.getElementById("tree-edit-input");
    const txt = el ? el.value.trim() : "";
    if(txt){
      S.nodes = S.nodes.map(n=>n.id===id?Object.assign({},n,{title:txt,lastUpdated:todayStr()}):n);
      maybeSync("rename");
    }
    S.treeEditId=null;
    render();
  }
  function nodeDelete(id){
    const node = byId(S.nodes, id); if(!node) return;
    // collect subtree ids
    const toDelete = new Set();
    function collect(nid){ toDelete.add(nid); childrenOf(S.nodes,nid).forEach(c=>collect(c.id)); }
    collect(id);
    const childCount = toDelete.size - 1;
    const msg = childCount > 0
      ? `確定刪除「${node.title}」及底下 ${childCount} 個子項目？此操作無法復原。`
      : `確定刪除「${node.title}」？此操作無法復原。`;
    if(!confirm(msg)) return;
    S.nodes = S.nodes.filter(n=>!toDelete.has(n.id));
    S.selectedId = null; S.view = "portfolio";
    render(); maybeSync("delete");
  }
  function addLog(type){
    const tEl=document.querySelector('[data-det="logText"]'); if(tEl) det.logText=tEl.value;
    if(!det.logText.trim()) { toast("先輸入內容再選類型"); return; }
    const node = byId(S.nodes, S.selectedId); if(!node) return;
    const entry = mkLog(type||"note", det.logText.trim());
    const advance = (type==="progress"||type==="milestone");
    S.nodes = S.nodes.map(n=>n.id===node.id?Object.assign({},n,Object.assign({
      logs:(n.logs||[]).concat(entry), lastUpdated:todayStr()
    }, advance?{lastProgress:todayStr(),progressSignal:"manual"}:{})):n);
    det.logText = "";
    render(); maybeSync("log");
  }
  function editLogSave(logId, fromId){
    const mEl=document.querySelector('[data-editlog="msg"]'); const dEl=document.querySelector('[data-editlog="date"]');
    const msg = (mEl?mEl.value:S.editLogMsg).trim();
    const date = (dEl?dEl.value:S.editLogDate)||todayStr();
    if(!msg){ S.editLogId=null; render(); return; }
    updateNode(fromId, n=>{
      n.logs=(n.logs||[]).map(l=> l.id===logId ? Object.assign({},l,{message:msg,date,content:undefined}) : l);
      return n;
    });
    S.editLogId=null; render(); maybeSync("log-edit");
  }
  function editLogDel(logId, fromId){
    updateNode(fromId, n=>{ n.logs=(n.logs||[]).filter(l=>l.id!==logId); return n; });
    S.editLogId=null; render(); maybeSync("log-del");
  }
  function doTransform(to, freeze){
    const node = byId(S.nodes, S.selectedId); if(!node) return;
    const now = todayStr();
    if(freeze){
      S.nodes = S.nodes.map(n=>n.id===node.id?Object.assign({},n,{portfolioState:"frozen",lastUpdated:now}):n);
      det.showTransform=false; render(); return;
    }
    const parentMap = { branch:"project", work:"branch", project:"portfolio" };
    S.nodes = S.nodes.map(n=>{
      if(n.id!==node.id) return n;
      const next = Object.assign({}, n, {
        type:to, transformFrom:node.type, transformAt:now, parentType:parentMap[to]||n.parentType,
        lastUpdated:now,
        logs:(n.logs||[]).concat({id:uid("log"),date:now,signal:"manual",content:`Converted ${node.type} → ${to}`})
      });
      if(to==="work"){ next.workStatus="todo"; delete next.executionStage; }
      if(to==="branch"){ next.executionStage = n.executionStage||"ready"; }
      if(to==="project"){ next.executionStage = n.executionStage||"ready"; next.stakeholders = n.stakeholders||[]; }
      return next;
    });
    det.showTransform=false;
    S.view="portfolio"; S.selectedId=null;
    render();
  }
  function toast(msg){
    let el = document.getElementById("kiko-toast");
    if(!el){
      el = document.createElement("div"); el.id="kiko-toast";
      el.style.cssText="position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:var(--ink,#2B2926);color:#fff;padding:10px 16px;border-radius:10px;font-size:13px;z-index:999;max-width:80%;text-align:center;box-shadow:0 6px 20px rgba(0,0,0,.25)";
      document.body.appendChild(el);
    }
    el.textContent = msg; el.style.opacity="1";
    clearTimeout(el._t); el._t=setTimeout(()=>{ el.style.opacity="0"; }, 2600);
  }
  function capCommitDisabled(){
    const p = cap.pick;
    if(!p) return true;
    if(p.mode==="work") return !(cap.nexts.length>0 || cap.title.trim());
    return !cap.title.trim();   // project / branch
  }
  function refreshCapCommit(){
    const btn = document.querySelector('[data-act="cap-commit"]');
    if(btn) btn.disabled = capCommitDisabled();
  }
  // ➕ create a new Account (portfolio) then select it; stay on Input
  function capNewAccount(){
    const name=(cap.newAccountName||"").trim(); if(!name) return;
    const now=todayStr();
    const id=uid("pf");
    S.nodes = S.nodes.concat({
      id, type:"portfolio", parentType:null, parentId:null, title:name, summary:"",
      portfolioState:"active", projectMode:cap.newAccountMode||"explore",
      tags:[], lastProgress:now, progressSignal:"manual", lastUpdated:now,
      logs:[], attachments:[]   // Account holds no log by design
    });
    cap.accountId=id; cap.newAccountName=""; cap.pick=null;
    render(); maybeSync("new-account");
  }
  function capCommit(){
    const now = todayStr();
    const p = cap.pick;
    // Sync from live DOM in case a mobile IME (composition) didn't fire 'input' into cap.*
    const tEl = document.querySelector('[data-cap="title"]'); if(tEl) cap.title = tEl.value;
    const lEl = document.querySelector('[data-cap="logText"]'); if(lEl) cap.logText = lEl.value;
    const dEl = document.querySelector('[data-cap="dday"]'); if(dEl) cap.dday = dEl.value;
    const ldEl = document.querySelector('[data-cap="logDate"]'); if(ldEl) cap.logDate = ldEl.value;
    if(!p){ toast("請先點上面的 ➕ 選一個位置（新專案／工項／待辦）"); return; }
    const hasContent = p.mode==="work" ? (cap.nexts.length>0 || cap.title.trim()) : !!cap.title.trim();
    if(!hasContent){ toast(p.mode==="work"?"請輸入待辦名稱（或先按「＋加待辦」）":"請輸入名稱"); return; }
    const att = cap.images.map(src=>({id:uid("att"),kind:"image",src,added:now}));
    let tags=[];
    if(cap.dday) tags.push(TAG_DDAY+cap.dday);
    if(cap.link) tags.push(TAG_LINK+cap.link);

    // create the picked child node(s)
    let createdProjectId = null;
    if(p.mode==="work"){
      const titles = cap.nexts.slice();
      const lead=(cap.title||"").trim(); if(lead) titles.push(lead);
      const made = titles.map((t,i)=>({
        id:uid("wk"), type:"work", parentType:"branch", parentId:p.parentId, title:t, summary:"",
        workStatus:"todo", owner:"", firstSuccessEvent:"", deadline:cap.dday||null,
        tags:tags.slice(), metadata:{priority:"normal"},
        lastProgress:now, progressSignal:"manual", lastUpdated:now,
        logs:[], attachments: i===0?att:[]
      }));
      S.nodes = S.nodes.concat(made);
    } else {
      const isProj = p.mode==="project";
      const node = isProj
        ? { id:uid("pr"), type:"project", parentType:"portfolio", parentId:p.parentId, title:cap.title.trim(), summary:"", executionStage:"ready", stakeholders:[], firstSuccessEvent:"", deadline:cap.dday||null }
        : { id:uid("br"), type:"branch", parentType:"project", parentId:p.parentId, title:cap.title.trim(), summary:"", executionStage:"ready", channel:"", firstSuccessEvent:"", deadline:cap.dday||null };
      Object.assign(node, { tags, metadata:{priority:"normal"}, lastProgress:now, progressSignal:"manual", lastUpdated:now, logs:[], attachments:att });
      S.nodes = S.nodes.concat(node);
      if(isProj) createdProjectId = node.id;
    }

    // optional log → always lands on the owning PROJECT level (Account never gets logs)
    const logText=(cap.logText||"").trim();
    if(logText){
      const proj = projectAncestor(S.nodes, p.parentId, p.mode) || (createdProjectId?byId(S.nodes,createdProjectId):null);
      if(proj){
        const date = cap.logDate || now;
        S.nodes = S.nodes.map(n=> n.id===proj.id ? Object.assign({},n,{
          logs:(n.logs||[]).concat({ id:uid("log"), date, type:cap.logType||"progress", message:logText }),
          lastUpdated:now, lastProgress:date, progressSignal:"manual"
        }) : n);
      }
    }

    // reset for next add but KEEP the account selected (keep adding under same account)
    const committedAccountId = cap.accountId;
    cap.pick=null; cap.title=""; cap.nexts=[]; cap.link=""; cap.dday="";
    cap.logText=""; cap.logDate=""; cap.logType="progress"; cap.images=[];
    // navigate to the account detail page so user can review/edit what was just created
    S.selectedId = committedAccountId;
    S.view = "detail";
    S.detailTab = "branch";
    det.showTransform = false;
    render();
    maybeSync("input");
  }
  function handleCapImg(files){
    const list = files && files.length ? Array.from(files) : (files?[files]:[]);
    let pending = list.length;
    if(!pending) return;
    list.forEach(file=>{
      if(!file || !file.type.startsWith("image/")){ pending--; return; }
      const reader = new FileReader();
      reader.onload = ev => {
        cap.images.push(ev.target.result);
        pending--;
        if(pending<=0) render();
      };
      reader.readAsDataURL(file);
    });
  }
  async function handleImportFile(file){
    if(!file) return;
    const name = file.name.toLowerCase();
    if(name.endsWith(".csv")||name.endsWith(".txt")){
      const txt = await file.text(); S.importRaw = txt; render(); return;
    }
    if(typeof XLSX==="undefined"){ alert("Excel library not loaded (offline?). Use CSV instead."); return; }
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, {type:"array"});
      const ws = wb.Sheets[wb.SheetNames[0]];
      S.importRaw = XLSX.utils.sheet_to_csv(ws);
      render();
    } catch(err){ alert("Could not read file: "+err.message); }
  }

  /* ─── boot ─────────────────────────────────────────────────────────────── */
  load();
  // Prevent migration/load from marking data dirty (which could auto-push stale data
  // over a newer cloud copy). Baseline the snapshot to the just-loaded state.
  try { _lastNodesJson = JSON.stringify(S.nodes||[]); } catch(e){}
  S.dirty = false;
  render();
  // If a sync URL exists, PULL from cloud first (a freshly-opened device may hold stale
  // local data). Only after pulling do we start auto-push, so we never overwrite a newer
  // cloud copy with this device's old data.
  if(S.syncUrl){
    syncPull({alert:false, silent:true}).then(()=>{ startAutoSync(); }).catch(()=>{ startAutoSync(); });
  }
})();
