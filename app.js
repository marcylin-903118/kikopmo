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

  /* ─── bilingual labels ─────────────────────────────────────────────────── */
  const L = {
    capture:"Capture 擷取", portfolio:"Portfolio 組合", project:"Project 專案",
    branch:"Branch 支線", work:"Work 工作項",
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
  };

  function load(){
    try { const r=localStorage.getItem(LS_KEY); if(r) S.nodes=JSON.parse(r); } catch(e){}
    try { const role=localStorage.getItem(LS_ROLE); if(role) S.role=role; } catch(e){}
  }
  function persist(){
    try { if(S.nodes) localStorage.setItem(LS_KEY, JSON.stringify(S.nodes)); } catch(e){}
    try { if(S.role) localStorage.setItem(LS_ROLE, S.role); } catch(e){}
  }

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
      case "detail":    screen = viewDetail(); break;
      default:          screen = viewDaily();
    }
    const nav = S.view==="detail" ? "" : bottomNav();
    root.innerHTML = `<div class="screen">${screen}</div>${nav}`;
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
      ? [["daily","Daily 焦點","☀"],["portfolio","Portfolio 組合","◉"],["export","Export 匯出","⤓"]]
      : [["daily","Daily 焦點","☀"],["capture","Capture 擷取","✱"],["portfolio","Portfolio 組合","◉"],
         ["import","Import 匯入","⤒"],["export","Export 匯出","⤓"]];
    return `<nav class="bottomnav">` + items.map(([id,label,ic])=>`
      <button data-act="nav" data-view="${id}" class="${S.view===id?"on":""}">
        <span class="ic">${ic}</span><span class="tx">${label}</span>
        ${S.view===id?'<span class="dot"></span>':""}
      </button>`).join("") + `</nav>`;
  }

  /* ─── DAILY PMO ────────────────────────────────────────────────────────── */
  function viewDaily(){
    const ns = S.nodes;
    const activeIds = new Set(ns.filter(n=>n.type==="portfolio"&&n.portfolioState==="active").map(n=>n.id));
    const works = ns.filter(n=>n.type==="work"&&n.workStatus!=="done"&&!n.mergeIntoId);
    const scored = works.map(w=>{
      const root=rootPortfolio(ns,w);
      const inActive = root && activeIds.has(root.id);
      const dl = w.deadline ? new Date(w.deadline)-Date.now() : Infinity;
      return { w, inActive, dl };
    }).sort((a,b)=>{
      if(a.inActive!==b.inActive) return a.inActive?-1:1;
      if(a.dl!==b.dl) return a.dl-b.dl;
      return daysSince(b.w.lastProgress)-daysSince(a.w.lastProgress);
    });
    const one = scored[0] && scored[0].w;
    const rest = scored.slice(1,3).map(s=>s.w);
    const blocked = ns.filter(n=>(n.type==="project"||n.type==="branch")&&n.executionStage==="blocked"&&!n.mergeIntoId);
    const stale = ns.filter(isStale);

    const right = `<button class="btn btn-ghost sm" data-act="logout">Switch 切換 →</button>`;

    let oneBlock;
    if(one){
      oneBlock = html`
      <div class="card" style="background:var(--mossBg);border-color:rgba(94,125,96,.3);padding:18px;margin-bottom:22px">
        <div class="tap" data-act="open" data-id="${one.id}">
          <div style="font-size:16px;font-weight:600;margin-bottom:4px">${esc(one.title)}</div>
          <div style="font-size:12px;color:var(--inkMid);margin-bottom:10px">${esc(one.summary||"")}</div>
          <div class="flex gap8 wrap aic">
            <span style="font-size:10px;color:var(--inkLight)">owner 負責：${esc(one.owner||"—")}</span>
            ${one.deadline?`<span style="font-size:10px;color:var(--clay)">· due ${fmt(one.deadline)}</span>`:""}
            ${one.firstSuccessEvent?`<span style="font-size:10px;color:var(--inkLight)">· win：${esc(one.firstSuccessEvent)}</span>`:""}
          </div>
        </div>
        <div class="seg mt10">
          ${["todo","doing","done"].map(s=>`
            <button data-act="workstatus" data-id="${one.id}" data-status="${s}"
              class="${one.workStatus===s?"on":""}"
              style="${one.workStatus===s?`background:${WORK_CFG[s].c};color:#fff`:""}">
              ${WORK_CFG[s].i} ${lblEn(s)}</button>`).join("")}
        </div>
      </div>`;
    } else {
      oneBlock = `<div class="card" style="border:1px dashed var(--border);padding:20px;margin-bottom:22px" class="center"><div class="empty">No open work items. 無待辦工作項。</div></div>`;
    }

    return html`
    ${topbar("Daily PMO 每日焦點", fmt(todayStr()), right)}
    <div class="pad">
      <div class="muted" style="font-size:11px;margin-bottom:16px">One focus today. 今天只專注一件事。</div>
      <div style="font-size:10px;font-weight:700;color:var(--moss);letter-spacing:.1em;margin-bottom:8px">TODAY'S ONE THING 今日唯一</div>
      ${oneBlock}
      ${rest.length?`
        <div style="font-size:10px;font-weight:700;color:var(--inkLight);letter-spacing:.1em;margin-bottom:8px">SECONDARY (MAX 2) 次要</div>
        ${rest.map(w=>`
          <div class="card tap" data-act="open" data-id="${w.id}" style="padding:11px 13px;margin-bottom:8px">
            <div style="font-size:13px;font-weight:600">${esc(w.title)}</div>
            <div style="font-size:11px;color:var(--inkMid)">${esc(w.owner||"—")} · ${w.deadline?"due "+fmt(w.deadline):"no deadline"}</div>
          </div>`).join("")}
        <div class="spacer"></div>` : ""}
      <div class="divider"></div>
      <div class="tiles mt6">
        <div class="tile" style="background:var(--clayBg)"><div class="v" style="color:var(--clay)">${blocked.length}</div><div class="k">Blocked 受阻</div></div>
        <div class="tile" style="background:var(--bambooBg)"><div class="v" style="color:var(--bamboo)">${stale.length}</div><div class="k">Stale &gt;7d 逾期未動</div></div>
      </div>
      <div class="note mt14">Daily PMO only changes work status &amp; progress. Activation lives in Monthly. 每日僅改工作狀態與進度。</div>
    </div>`;
  }

  /* ─── CAPTURE ──────────────────────────────────────────────────────────── */
  const cap = { raw:"", signal:"screenshot", target:"", parentId:"", title:"", so:false, sd:false, sr:false, mode:"explore" };
  function viewCapture(){
    const ns = S.nodes;
    const portfolios = ns.filter(n=>n.type==="portfolio"&&!n.mergeIntoId);
    const projects   = ns.filter(n=>n.type==="project"&&!n.mergeIntoId);
    const branches   = ns.filter(n=>n.type==="branch"&&!n.mergeIntoId);
    const anyNode    = ns.filter(n=>["portfolio","project","branch","work"].includes(n.type)&&!n.mergeIntoId);
    const parentChoices = { update:anyNode, work:branches, branch:projects, project:portfolios, suggest:[] }[cap.target] || [];
    const mergeYes = [cap.so,cap.sd,cap.sr].filter(Boolean).length;

    const targetOpts = [
      ["","— choose 選擇 —"],
      ["update","Update 更新 → append log"],
      ["work","Work Item 工作項 → under Branch"],
      ["branch","Branch 支線 → under Project"],
      ["project","Project 專案 → under Portfolio"],
      ["suggest","Suggest Portfolio 建議組合 (exceptional)"],
    ];

    let parentBlock = "";
    if(cap.target && cap.target!=="suggest"){
      parentBlock = html`
        <div class="field">
          <span class="label">${cap.target==="update"?"Attach to 附加到":"Parent 父節點"}</span>
          <select data-cap="parentId">
            <option value="">— select 選擇 —</option>
            ${parentChoices.map(n=>`<option value="${n.id}" ${cap.parentId===n.id?"selected":""}>${TYPE_CFG[n.type].i} ${esc(n.title)}</option>`).join("")}
          </select>
        </div>`;
    }
    let titleBlock = "";
    if(cap.target && cap.target!=="update" && cap.target!=="suggest"){
      titleBlock = html`<div class="field"><span class="label">Title 標題</span><input type="text" data-cap="title" value="${esc(cap.title)}" placeholder="New node title 新節點標題"></div>`;
    }
    let suggestBlock = "";
    if(cap.target==="suggest"){
      suggestBlock = html`
      <div class="card" style="background:var(--bambooBg);border-color:rgba(184,168,120,.4);padding:14px;margin-bottom:12px">
        <span class="label">Merge check 合併檢查（≥2 → 建議合併）</span>
        ${[["so","Shared outcome? 共同成果？"],["sd","Shared deadline? 共同期限？"],["sr","Shared resources? 共用資源？"]].map(([k,t])=>`
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--inkMid);padding:4px 0">
            <input type="checkbox" data-cap-check="${k}" ${cap[k]?"checked":""}> ${t}
          </label>`).join("")}
        ${mergeYes>=2
          ? `<div style="font-size:11px;color:var(--clay);font-weight:600;margin-top:8px">⚠ ≥2 yes → prefer MERGE into an existing node, not a new Portfolio. 建議合併到既有節點。</div>`
          : `<div style="font-size:11px;color:var(--moss);margin-top:8px">&lt;2 yes → a new Portfolio may be justified. 可建立新組合。</div>`}
        <div class="field mt8"><span class="label">Portfolio title 組合標題</span><input type="text" data-cap="title" value="${esc(cap.title)}" placeholder="New portfolio name…"></div>
        <div class="field"><span class="label">Project mode 模式</span>
          <select data-cap="mode">${["deliver","build","explore"].map(m=>`<option value="${m}" ${cap.mode===m?"selected":""}>${lbl(m)}</option>`).join("")}</select>
        </div>
      </div>`;
    }

    const disabled = capCommitDisabled();

    return html`
    ${topbar("Capture 擷取","disposable intake · classify to resolve")}
    <div class="pad">
      <div class="note-muted" style="border-radius:var(--r);padding:12px 14px;margin-bottom:16px;font-size:11px;line-height:1.6">
        Capture is disposable. Classify it down the tree — attach as <b>low</b> as possible.
        擷取是暫時的，分類後即完成；盡量往低層掛。
      </div>

      <span class="label">Screenshot 截圖（manual-fill）</span>
      <div class="drop" data-act="pickimg" id="capdrop">
        <div style="font-size:22px;margin-bottom:4px">📷</div>
        <div style="font-size:12px;color:var(--inkMid)">Tap to add 點擊新增（OCR deferred）</div>
        <input type="file" accept="image/*" id="capimg" style="display:none">
      </div>
      <div id="capimgprev"></div>

      <div class="divider"></div>
      <div class="field"><span class="label">Captured text 擷取內容</span>
        <textarea data-cap="raw" rows="3" placeholder="Paste LINE / email / note 貼上訊息…">${esc(cap.raw)}</textarea></div>
      <div class="field"><span class="label">Progress signal 進度訊號</span>
        <select data-cap="signal">${["screenshot","chat","meeting","manual","import"].map(k=>`<option value="${k}" ${cap.signal===k?"selected":""}>${lbl(k)}</option>`).join("")}</select></div>

      <div class="sect">Classify 分類</div>
      <div class="field"><span class="label">Resolution 分類去向</span>
        <select data-cap="target">${targetOpts.map(([v,t])=>`<option value="${v}" ${cap.target===v?"selected":""}>${t}</option>`).join("")}</select></div>
      ${parentBlock}
      ${titleBlock}
      ${suggestBlock}

      <button class="btn btn-primary full" data-act="cap-commit" ${disabled?"disabled":""}>
        ${cap.target==="suggest"?"Create Portfolio (confirm) 建立組合":"Resolve Capture 完成分類"}
      </button>
      <div class="center muted" style="font-size:10px;margin-top:8px">User confirms all creation. AI only suggests. 所有建立由使用者確認。</div>
    </div>`;
  }

  /* ─── PORTFOLIO ────────────────────────────────────────────────────────── */
  function nodeRowHtml(node, ns, depth){
    const kids = childrenOf(ns,node.id);
    const hasKids = kids.length>0;
    const indent = depth*16;
    const toggle = hasKids
      ? `<button class="tree-toggle" data-act="toggle" data-id="${node.id}">${S.expanded[node.id]?"▾":"▸"}</button>`
      : `<span style="width:14px;flex-shrink:0"></span>`;
    let out = html`
      <div class="node-row" style="margin-left:${indent}px;border-left:3px solid ${TYPE_CFG[node.type].c}" data-act="open" data-id="${node.id}">
        ${toggle}
        <div class="grow">
          <div class="title">${esc(node.title)}</div>
          ${node.firstSuccessEvent?`<div class="sub">→ ${esc(node.firstSuccessEvent)}</div>`:""}
        </div>
        <div class="flex aic" style="gap:5px;flex-shrink:0">
          ${staleBadge(node)}${maturityPill(node)}${typePill(node.type)}
        </div>
      </div>`;
    if(hasKids && S.expanded[node.id]){
      out += kids.map(k=>nodeRowHtml(k, ns, depth+1)).join("");
    }
    return out;
  }
  function viewPortfolio(){
    const ns = S.nodes;
    const states = ["active","incubator","inbox","frozen","archived"];
    const portfolios = ns.filter(n=>n.type==="portfolio"&&n.portfolioState===S.pfFilter&&!n.mergeIntoId);
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

    let body;
    if(portfolios.length===0){
      body = `<div class="empty">No portfolios here 此狀態無組合</div>`;
    } else {
      body = portfolios.map(p=>`
        <div class="up" style="margin-bottom:14px">
          <div class="flex aic gap8 mb8" style="padding:0 2px">
            <span style="font-size:14px;color:var(--moss)">◉</span>
            <span style="font-size:14px;font-weight:600;flex:1">${esc(p.title)}</span>
            ${pill({c:"var(--inkMid)",bg:"var(--bgMuted)",i:"◷"}, lblEn(p.projectMode))}
          </div>
          <div class="node-row tap" style="border-left:3px solid var(--moss)" data-act="open" data-id="${p.id}">
            <div class="grow"><div style="font-size:11px;color:var(--inkLight)">${esc(p.summary||"")}</div></div>
            ${maturityPill(p)}
          </div>
          ${childrenOf(ns,p.id).map(proj=>nodeRowHtml(proj, ns, 1)).join("")}
        </div>`).join("");
    }

    return html`
    ${topbar("Portfolio 組合", activeCount+" active")}
    <div class="wip">${wipHtml}</div>
    <div class="chips">${chipsHtml}</div>
    <div class="pad-wide" style="max-width:560px;margin:0 auto">${body}</div>`;
  }

  /* ─── DETAIL ───────────────────────────────────────────────────────────── */
  const det = { logText:"", logSignal:"manual", showTransform:false };
  function viewDetail(){
    const ns = S.nodes;
    const node = byId(ns, S.selectedId);
    if(!node){ S.view="daily"; return viewDaily(); }
    const isFactory = S.role==="factory";
    const kids = childrenOf(ns, node.id);

    const maturityOpts = node.type==="portfolio" ? ["inbox","incubator","active","frozen","archived"]
      : node.type==="work" ? ["todo","doing","done"]
      : ["ready","developing","blocked","complete"];
    const curMaturity = node.portfolioState||node.workStatus||node.executionStage;

    const transforms = {
      project:[{to:"branch",label:"Convert → Branch 轉為支線"}],
      branch:[{to:"work",label:"Convert → Work 轉為工作項"}],
      work:[{to:"project",label:"Convert → Project 轉為專案"}],
      portfolio:[{to:"frozen",label:"Freeze 凍結",freeze:true}],
    }[node.type] || [];

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
          <h2 style="font-family:'Lora',serif;font-size:17px;font-weight:400;line-height:1.25">${esc(node.title)}</h2>
        </div>
        ${(!isFactory&&!node.mergeIntoId)?`<button class="btn btn-ghost sm" data-act="toggle-transform">⤿ Merge</button>`:""}
      </div>
      <div class="flex aic gap6 wrap mb14">
        ${maturityPill(node,true)}${staleBadge(node)}
        <span style="font-size:11px;color:var(--inkLight);margin-left:auto">progress ${fmt(node.lastProgress)} · ${lblEn(node.progressSignal||"manual")}</span>
      </div>
      <div class="tabs">
        ${[["info","資訊"],["timeline","時間軸"],["children","下層"]].map(([id,t])=>`
          <button data-act="tab" data-tab="${id}" class="${S.detailTab===id?"on":""}">${t}</button>`).join("")}
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
    if(S.detailTab==="info"){
      const maturityControl = (!isFactory || node.type==="work") ? html`
        <div class="mb14">
          <span class="label">${node.type==="portfolio"?"Portfolio State 組合狀態":node.type==="work"?"Work Status 工作狀態":"Execution Stage 執行階段"}</span>
          <div class="flex gap6 wrap">
            ${maturityOpts.map(s=>{
              const cfg = node.type==="portfolio"?PORTFOLIO_CFG[s]:node.type==="work"?WORK_CFG[s]:STAGE_CFG[s];
              const on = curMaturity===s;
              return `<button data-act="set-maturity" data-val="${s}" style="padding:5px 11px;border:none;border-radius:99px;font-size:11px;font-weight:600;${on?`background:${cfg.c};color:#fff`:`background:${cfg.bg};color:${cfg.c};border:1px solid ${cfg.c}30`}">${cfg.i} ${lblEn(s)}</button>`;
            }).join("")}
          </div>
        </div>` : "";

      const facts = [];
      if(node.type==="portfolio") facts.push(["Mode 模式", lbl(node.projectMode)]);
      if(node.type!=="portfolio") facts.push(["Deadline 期限", fmt(node.deadline)]);
      if(node.firstSuccessEvent) facts.push(["First success 成功訊號", node.firstSuccessEvent]);
      if(node.owner) facts.push(["Owner 負責", node.owner]);
      if(node.channel) facts.push(["Channel 管道", node.channel]);
      if(node.clientName) facts.push(["Client 客戶", node.clientName]);

      const stake = (node.stakeholders&&node.stakeholders.length)
        ? `<div class="divider"></div><span class="label">Stakeholders 利害關係人</span>${node.stakeholders.map(s=>`<div style="font-size:12px;color:var(--inkMid);padding:3px 0">${esc(s.name)} · ${esc(s.role)} · ${esc(s.channel)}</div>`).join("")}` : "";
      const tags = (node.tags&&node.tags.length)
        ? `<div class="flex gap6 wrap mt14">${node.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div>` : "";

      tabBody = html`
      <div class="up">
        <p style="font-size:13px;color:var(--inkMid);line-height:1.7;margin-bottom:14px">${esc(node.summary||"—")}</p>
        ${maturityControl}
        <div class="divider"></div>
        <div class="row2" style="gap:10px 16px">
          ${facts.map(([k,v])=>`<div><span class="label">${k}</span><div style="font-size:12px;color:var(--inkMid)">${esc(v)}</div></div>`).join("")}
        </div>
        ${stake}${tags}
      </div>`;
    }
    else if(S.detailTab==="timeline"){
      const logs = (node.logs||[]).slice().reverse().map(g=>`
        <div class="log">
          <div class="dot">✎</div>
          <div class="body">
            <div class="meta">${fmt(g.date)} · ${lblEn(g.signal||"manual")}</div>
            <div class="content">${esc(g.content)}</div>
          </div>
        </div>`).join("");
      tabBody = html`
      <div class="up">
        <div class="card" style="padding:13px;margin-bottom:14px">
          <span class="label">Add log 新增記錄（advances progress）</span>
          <div class="field"><select data-det="logSignal">${["manual","meeting","import","screenshot","chat"].map(k=>`<option value="${k}" ${det.logSignal===k?"selected":""}>${lbl(k)}</option>`).join("")}</select></div>
          <textarea data-det="logText" rows="2" placeholder="What moved? 有什麼進展…">${esc(det.logText)}</textarea>
          <div class="flex" style="justify-content:flex-end;margin-top:7px"><button class="btn btn-primary sm" data-act="addlog">Add 新增</button></div>
        </div>
        ${logs || `<div class="empty">No log yet 尚無記錄</div>`}
      </div>`;
    }
    else if(S.detailTab==="children"){
      let kidsHtml = kids.length
        ? kids.map(k=>`
          <div class="node-row" style="border-left:3px solid ${TYPE_CFG[k.type].c}" data-act="open" data-id="${k.id}">
            <div class="grow"><div style="font-size:12px;font-weight:600">${esc(k.title)}</div>
              <div class="sub">${childrenOf(ns,k.id).length} children</div></div>
            ${maturityPill(k)}${typePill(k.type)}
          </div>`).join("")
        : `<div class="empty">No children 無下層節點</div>`;
      const allDone = kids.length>0 && kids.every(k=>k.executionStage==="complete"||k.workStatus==="done");
      let suggestion = "";
      if(allDone){
        suggestion = html`
        <div style="background:var(--mossBg);border:1px solid rgba(94,125,96,.3);border-radius:var(--rsm);padding:12px;margin-top:10px">
          <div style="font-size:11px;font-weight:600;color:var(--moss);margin-bottom:6px">All children complete — your call 全部完成，由你決定</div>
          ${node.type==="portfolio"?`<div class="flex gap6">
            <button class="btn btn-ghost sm" data-act="set-maturity" data-val="archived">Archive 封存</button>
            <button class="btn btn-ghost sm" data-act="set-maturity" data-val="frozen">Freeze 凍結</button>
            <button class="btn btn-ghost sm" data-act="noop">Keep Active 維持</button>
          </div>`:""}
        </div>`;
      }
      tabBody = `<div class="up">${kidsHtml}${suggestion}</div>`;
    }

    return header + `<div class="pad-wide" style="padding:16px 18px 100px">${transformPanel}${tabBody}</div>`;
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
    const created=[], updated=[], merged=[], ignored=[], conflicts=[];
    rows.forEach(r=>{
      // match existing node: prefer id, fall back to title
      const exById = r.id && existingIds.has(r.id) ? ns.find(n=>n.id===r.id) : null;
      const exByTitle = idxTitle.get(r.title);
      const ex = exById || exByTitle;
      if(ex){
        if(S.importMode==="append") ignored.push(r);
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
    S.importReport = { created, updated, merged, ignored, conflicts, mode:S.importMode };
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
        base.portfolioState = r.portfolioState || "inbox";
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
      const applyDisabled = S.importMode==="preview" || (rep.created.length===0 && rep.updated.length===0);
      reportBlock = html`
      <div class="up" style="margin-top:16px">
        <div class="card" style="padding:16px">
          <span class="label">Import Report（mode: ${rep.mode}）</span>
          <div class="row2" style="gap:8px 16px;margin-top:8px">
            <div><span class="label">created 新增</span><div style="font-size:12px;color:var(--inkMid)">${rep.created.length}</div></div>
            <div><span class="label">updated 更新</span><div style="font-size:12px;color:var(--inkMid)">${rep.updated.length}</div></div>
            <div><span class="label">merged 合併</span><div style="font-size:12px;color:var(--inkMid)">${rep.merged.length}</div></div>
            <div><span class="label">ignored 略過</span><div style="font-size:12px;color:var(--inkMid)">${rep.ignored.length}</div></div>
          </div>
          ${conflicts}${willCreate}
          <button class="btn btn-primary full mt14" data-act="import-apply" ${applyDisabled?"disabled":""}>
            ${S.importMode==="preview"?"Preview only — switch to Merge/Append to apply":"Apply Import 套用匯入"}
          </button>
        </div>
      </div>`;
    }
    return html`
    ${topbar("Import 匯入","Import › Merge › Export · never overwrite")}
    <div class="pad">
      <div class="note-info" style="border-radius:var(--r);padding:12px 14px;margin-bottom:16px;font-size:11px;line-height:1.6">
        Load an Excel/CSV file or paste rows. Supports the <b>full schema</b> (id, type, parentId, …) or the <b>short form</b> (title, type, parentTitle, summary). Import never replaces existing nodes.
        可載入 Excel/CSV 或貼上。支援<b>完整欄位</b>（id, type, parentId…）或<b>簡式</b>（title, type, parentTitle, summary）。匯入不會覆蓋既有資料。
      </div>
      <div class="seg mb14">
        ${[["preview","Preview Diff 預覽"],["merge","Merge 合併"],["append","Append 新增"]].map(([m,t])=>`
          <button data-act="import-mode" data-mode="${m}" class="${S.importMode===m?"on":""}" style="${S.importMode===m?"background:var(--ink);color:#fff":""}">${t}</button>`).join("")}
      </div>
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
      const t = e.target.closest("[data-act]");
      if(!t) return;
      const act = t.getAttribute("data-act");
      switch(act){
        case "login": S.role=t.getAttribute("data-role"); S.view="daily"; render(); break;
        case "logout": S.role=null; S.selectedId=null; try{localStorage.removeItem(LS_ROLE);}catch(_){} render(); break;
        case "seed-confirm": S.nodes=JSON.parse(JSON.stringify(SEED_NODES)); render(); break;
        case "seed-skip": S.nodes=[]; render(); break;
        case "nav": { const v=t.getAttribute("data-view");
          if((v==="capture"||v==="import")&&S.role==="factory") return;
          S.selectedId=null; S.view=v; render(); break; }
        case "open": S.selectedId=t.getAttribute("data-id"); S.view="detail"; S.detailTab="info"; det.showTransform=false; render(); break;
        case "back": S.selectedId=null; S.view="daily"; render(); break;
        case "tab": S.detailTab=t.getAttribute("data-tab"); render(); break;
        case "toggle": { const id=t.getAttribute("data-id"); S.expanded[id]=!S.expanded[id]; render(); e.stopPropagation(); break; }
        case "pf": S.pfFilter=t.getAttribute("data-state"); render(); break;
        case "workstatus": setWorkStatus(t.getAttribute("data-id"), t.getAttribute("data-status")); break;
        case "set-maturity": setMaturity(t.getAttribute("data-val")); break;
        case "toggle-transform": det.showTransform=!det.showTransform; render(); break;
        case "transform": doTransform(t.getAttribute("data-to"), t.getAttribute("data-freeze")==="1"); break;
        case "addlog": addLog(); break;
        case "cap-commit": capCommit(); break;
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
        // otherwise just refresh the commit button's disabled state live (preserve focus)
        refreshCapCommit();
        return;
      }
      if(el.hasAttribute("data-det")){ det[el.getAttribute("data-det")] = el.value; return; }
      if(el.hasAttribute("data-imp")){ S.importRaw = el.value;
        const btn = root.querySelector('[data-act="import-compute"]');
        if(btn) btn.disabled = !S.importRaw.trim();
        return;
      }
    };
    // selects fire 'change', not 'input', in some browsers — mirror the handler
    root.addEventListener("change", e => {
      const el = e.target;
      if(el.hasAttribute("data-cap")){ cap[el.getAttribute("data-cap")] = el.value;
        if(el.getAttribute("data-cap")==="target"){ cap.parentId=""; render(); return; }
        refreshCapCommit();
      }
    });
    root.onchange = e => {
      const el = e.target;
      if(el.hasAttribute("data-cap-check")){ cap[el.getAttribute("data-cap-check")] = el.checked; render(); return; }
      if(el.id==="capimg"){ handleCapImg(el.files[0]); return; }
      if(el.id==="importfile"){ handleImportFile(el.files[0]); return; }
    };
  }

  /* ─── actions ──────────────────────────────────────────────────────────── */
  function setWorkStatus(id, s){
    S.nodes = S.nodes.map(n=>n.id===id?Object.assign({},n,{workStatus:s,lastUpdated:todayStr(),lastProgress:todayStr(),progressSignal:"manual"}):n);
    render();
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
  function addLog(){
    if(!det.logText.trim()) return;
    const node = byId(S.nodes, S.selectedId); if(!node) return;
    const entry = { id:uid("log"), date:todayStr(), signal:det.logSignal, content:det.logText };
    S.nodes = S.nodes.map(n=>n.id===node.id?Object.assign({},n,{
      logs:(n.logs||[]).concat(entry), lastUpdated:todayStr(), lastProgress:todayStr(), progressSignal:det.logSignal
    }):n);
    det.logText = "";
    render();
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
  function capCommitDisabled(){
    return !cap.target
      || (cap.target!=="suggest"&&cap.target!=="update"&&(!cap.parentId||!cap.title))
      || (cap.target==="update"&&!cap.parentId)
      || (cap.target==="suggest"&&!cap.title);
  }
  function refreshCapCommit(){
    const btn = document.querySelector('[data-act="cap-commit"]');
    if(btn) btn.disabled = capCommitDisabled();
  }
  function capCommit(){
    const now = todayStr();
    const ns = S.nodes;
    if(cap.target==="update"){
      S.nodes = ns.map(n=>n.id===cap.parentId?Object.assign({},n,{
        logs:(n.logs||[]).concat({id:uid("log"),date:now,signal:cap.signal,content:cap.raw}),
        lastUpdated:now, lastProgress:now, progressSignal:cap.signal
      }):n);
    } else {
      let node;
      if(cap.target==="work")    node={id:uid("wk"),type:"work",parentType:"branch",parentId:cap.parentId,title:cap.title,summary:cap.raw,workStatus:"todo",owner:"",firstSuccessEvent:"",deadline:null};
      if(cap.target==="branch")  node={id:uid("br"),type:"branch",parentType:"project",parentId:cap.parentId,title:cap.title,summary:cap.raw,executionStage:"ready",channel:"",firstSuccessEvent:"",deadline:null};
      if(cap.target==="project") node={id:uid("pr"),type:"project",parentType:"portfolio",parentId:cap.parentId,title:cap.title,summary:cap.raw,executionStage:"ready",stakeholders:[],firstSuccessEvent:"",deadline:null};
      if(cap.target==="suggest") node={id:uid("p"),type:"portfolio",parentType:null,parentId:null,title:cap.title,summary:cap.raw,portfolioState:"inbox",projectMode:cap.mode||"explore"};
      node = Object.assign(node, { tags:[], lastProgress:now, progressSignal:cap.signal, lastUpdated:now,
        logs:[{id:uid("log"),date:now,signal:cap.signal,content:cap.raw||"created from capture"}], attachments:[] });
      S.nodes = ns.concat(node);
    }
    // reset capture form
    cap.raw=""; cap.target=""; cap.parentId=""; cap.title=""; cap.so=false; cap.sd=false; cap.sr=false; cap.mode="explore"; cap.signal="screenshot";
    S.view="portfolio";
    render();
  }
  function handleCapImg(file){
    if(!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const prev = document.getElementById("capimgprev");
      if(prev) prev.innerHTML = `<div style="margin-top:8px;border:1px solid var(--border);border-radius:var(--r);overflow:hidden">
        <img src="${ev.target.result}" style="width:100%;display:block;max-height:140px;object-fit:cover"></div>`;
      cap.raw = (cap.raw?cap.raw+"\n":"") + `[screenshot ${file.name}] — manual fill (OCR deferred)`;
      const ta = document.querySelector('[data-cap="raw"]'); if(ta) ta.value = cap.raw;
    };
    reader.readAsDataURL(file);
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
  render();
})();
