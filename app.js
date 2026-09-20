"use strict";

/* =========================
   LZDSG NETWORK LAB V3
   ========================= */

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const STORAGE_KEY = "lzdsg-network-lab-v3";

const defaultState = {
  xp: 0,
  actions: 0,
  today: new Date().toISOString().slice(0, 10),
  favorites: [],
  recent: [],
  theme: "dark",
  lowfx: false,
  challenge: null,
  challengeDone: false
};

let state = loadState();

const tools = [

  /* NETWORK */

  {
    id: "ip",
    category: "网络",
    icon: "🌐",
    name: "IP 查询",
    desc: "查看当前公网 IP",
    action: openIP
  },

  {
    id: "dns",
    category: "网络",
    icon: "🔎",
    name: "DNS 查询",
    desc: "查询域名 DNS 记录",
    action: openDNS
  },

  {
    id: "http",
    category: "网络",
    icon: "⚡",
    name: "HTTP 检测",
    desc: "检测网页 HTTP 状态",
    action: openHTTP
  },

  {
    id: "headers",
    category: "网络",
    icon: "📋",
    name: "Headers",
    desc: "查看浏览器请求信息",
    action: openHeaders
  },

  {
    id: "network",
    category: "网络",
    icon: "📡",
    name: "网络信息",
    desc: "查看浏览器网络环境",
    action: openNetwork
  },

  {
    id: "ping",
    category: "网络",
    icon: "🏓",
    name: "HTTP Ping",
    desc: "测试网页响应耗时",
    action: openPing
  },

  /* DEVELOPMENT */

  {
    id: "json",
    category: "开发",
    icon: "{}",
    name: "JSON 工具",
    desc: "格式化 / 压缩 JSON",
    action: openJSON
  },

  {
    id: "base64",
    category: "开发",
    icon: "64",
    name: "Base64",
    desc: "Base64 编码与解码",
    action: openBase64
  },

  {
    id: "url",
    category: "开发",
    icon: "🔗",
    name: "URL 编解码",
    desc: "Encode / Decode URL",
    action: openURL
  },

  {
    id: "jwt",
    category: "开发",
    icon: "🎫",
    name: "JWT 解码",
    desc: "查看 JWT Payload",
    action: openJWT
  },

  {
    id: "hash",
    category: "开发",
    icon: "#",
    name: "Hash 计算",
    desc: "SHA-256 / SHA-1",
    action: openHash
  },

  {
    id: "regex",
    category: "开发",
    icon: ".*",
    name: "正则测试",
    desc: "在线测试正则表达式",
    action: openRegex
  },

  /* UTILITY */

  {
    id: "uuid",
    category: "实用",
    icon: "🆔",
    name: "UUID",
    desc: "生成随机 UUID",
    action: openUUID
  },

  {
    id: "password",
    category: "实用",
    icon: "🔐",
    name: "随机密码",
    desc: "生成安全随机密码",
    action: openPassword
  },

  {
    id: "time",
    category: "实用",
    icon: "⏱",
    name: "时间转换",
    desc: "Unix 时间戳转换",
    action: openTime
  },

  {
    id: "text",
    category: "实用",
    icon: "Aa",
    name: "文本统计",
    desc: "统计字符和单词",
    action: openText
  },

  {
    id: "color",
    category: "实用",
    icon: "🎨",
    name: "颜色工具",
    desc: "HEX / RGB 转换",
    action: openColor
  },

  {
    id: "qr",
    category: "实用",
    icon: "▦",
    name: "二维码",
    desc: "生成二维码",
    action: openQR
  }

];

/* =========================
   STORAGE
   ========================= */

function loadState(){

  try{

    const raw = localStorage.getItem(STORAGE_KEY);

    if(!raw){
      return {...defaultState};
    }

    const saved = JSON.parse(raw);

    const result = {
      ...defaultState,
      ...saved
    };

    const today = new Date().toISOString().slice(0,10);

    if(result.today !== today){

      result.today = today;
      result.actions = 0;
      result.challengeDone = false;
    }

    return result;

  }catch{

    return {...defaultState};
  }
}

function saveState(){

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}

/* =========================
   XP SYSTEM
   ========================= */

function levelInfo(){

  let level = 1;
  let xp = state.xp;
  let need = 100;

  while(xp >= need){

    xp -= need;
    level++;

    need = 100 + (level - 1) * 25;
  }

  return {
    level,
    current: xp,
    need
  };
}

function addXP(amount){

  state.xp += amount;
  state.actions++;

  saveState();
  updateDashboard();

  toast(`+${amount} XP`);
}

function updateDashboard(){

  const info = levelInfo();

  $("#level").textContent = info.level;

  $("#xpText").textContent =
    `${info.current} / ${info.need} XP`;

  $("#xpBar").style.width =
    `${Math.min(100, info.current / info.need * 100)}%`;

  $("#levelHint").textContent =
    `距离下一级还差 ${info.need - info.current} XP`;

  $("#todayText").textContent =
    `${state.actions} 次操作`;

  $("#toolCount").textContent =
    tools.length;

  $("#favCount").textContent =
    state.favorites.length;

  $("#achievementCount").textContent =
    achievementCount();

  renderChallenge();
}

/* =========================
   ACHIEVEMENTS
   ========================= */

function achievementCount(){

  let n = 0;

  if(state.actions >= 1) n++;
  if(state.actions >= 10) n++;
  if(state.xp >= 500) n++;
  if(state.favorites.length >= 3) n++;
  if(state.recent.length >= 5) n++;

  return n;
}

/* =========================
   TOOL LIST
   ========================= */

function renderTools(list = tools){

  const root = $("#toolSections");

  root.innerHTML = "";

  const categories = [...new Set(
    list.map(t => t.category)
  )];

  if(!list.length){

    root.innerHTML = `
      <div class="empty">
        没找到对应工具。
      </div>
    `;

    $("#resultCount").textContent = "0 个结果";

    return;
  }

  $("#resultCount").textContent =
    `${list.length} 个结果`;

  categories.forEach(category => {

    const section =
      document.createElement("div");

    section.className = "tool-category";

    const icon =
      category === "网络"
        ? "🌐"
        : category === "开发"
          ? "⌘"
          : "🧰";

    section.innerHTML = `
      <h3 class="category-title">
        <span>${icon}</span>
        ${category}
      </h3>
      <div class="tool-grid"></div>
    `;

    const grid =
      section.querySelector(".tool-grid");

    list
      .filter(t => t.category === category)
      .forEach(t => grid.appendChild(
        createToolCard(t)
      ));

    root.appendChild(section);
  });
}

function createToolCard(tool){

  const card =
    document.createElement("button");

  card.className = "tool-card";

  const active =
    state.favorites.includes(tool.id);

  card.innerHTML = `
    <button
      class="fav ${active ? "active" : ""}"
      title="收藏"
      data-fav="${tool.id}"
    >★</button>

    <div class="tool-icon">${tool.icon}</div>

    <h3>${tool.name}</h3>

    <p>${tool.desc}</p>
  `;

  card.addEventListener("click", e => {

    if(e.target.closest("[data-fav]")){
      return;
    }

    useTool(tool);
  });

  const fav =
    card.querySelector("[data-fav]");

  fav.addEventListener("click", e => {

    e.stopPropagation();

    toggleFavorite(tool.id);
  });

  return card;
}

function renderRecent(){

  const root = $("#recentTools");

  root.innerHTML = "";

  if(!state.recent.length){

    root.innerHTML = `
      <div class="muted-box">
        还没有使用记录，去工具箱试试。
      </div>
    `;

    return;
  }

  state.recent
    .map(id => tools.find(t => t.id === id))
    .filter(Boolean)
    .forEach(tool => {

      root.appendChild(
        createToolCard(tool)
      );

    });
}

function useTool(tool){

  state.recent =
    [tool.id, ...state.recent.filter(
      id => id !== tool.id
    )].slice(0,8);

  saveState();
  renderRecent();

  tool.action();

  addXP(10);

  checkChallenge(tool.id);
}

/* =========================
   FAVORITES
   ========================= */

function toggleFavorite(id){

  if(state.favorites.includes(id)){

    state.favorites =
      state.favorites.filter(x => x !== id);

    toast("已取消收藏");

  }else{

    state.favorites.push(id);

    toast("已收藏");

    addXP(5);
  }

  saveState();

  renderTools(
    filterTools($("#searchInput").value)
  );

  renderRecent();
}

/* =========================
   SEARCH
   ========================= */

function filterTools(query){

  query =
    query.trim().toLowerCase();

  if(!query){
    return tools;
  }

  return tools.filter(t =>
    [
      t.name,
      t.desc,
      t.category,
      t.id
    ]
    .join(" ")
    .toLowerCase()
    .includes(query)
  );
}

$("#searchInput").addEventListener(
  "input",
  e => {

    renderTools(
      filterTools(e.target.value)
    );

  }
);

document.addEventListener(
  "keydown",
  e => {

    if(
      (e.ctrlKey || e.metaKey) &&
      e.key.toLowerCase() === "k"
    ){

      e.preventDefault();

      $("#searchInput").focus();
    }

    if(e.key === "Escape"){
      closeModal();
    }

  }
);

/* =========================
   RANDOM TOOL
   ========================= */

$("#randomBtn").addEventListener(
  "click",
  () => {

    const tool =
      tools[Math.floor(
        Math.random() * tools.length
      )];

    useTool(tool);
  }
);

/* =========================
   MODAL
   ========================= */

function openModal(title, category, body){

  $("#modalTitle").textContent = title;
  $("#modalCategory").textContent = category;
  $("#modalBody").innerHTML = body;

  $("#modal").classList.add("open");
  $("#modal").setAttribute(
    "aria-hidden",
    "false"
  );
}

function closeModal(){

  $("#modal").classList.remove("open");
  $("#modal").setAttribute(
    "aria-hidden",
    "true"
  );
}

$$("[data-close]").forEach(
  el => el.addEventListener(
    "click",
    closeModal
  )
);

/* =========================
   IP
   ========================= */

function openIP(){

  openModal(
    "IP 查询",
    "网络",
    `
    <div class="tool-form">

      <button class="tool-action" id="ipRun">
        查询当前公网 IP
      </button>

      <div id="ipResult" class="result">
        点击按钮开始查询。
      </div>

    </div>
    `
  );

  $("#ipRun").onclick = async () => {

    const result = $("#ipResult");

    result.textContent = "查询中…";

    try{

      const r =
        await fetch(
          "https://api.ipify.org?format=json",
          {cache:"no-store"}
        );

      if(!r.ok){
        throw new Error("HTTP "+r.status);
      }

      const data = await r.json();

      result.className = "result good";

      result.textContent =
        `公网 IPv4\n${data.ip}`;

    }catch(e){

      result.className = "result error";

      result.textContent =
        "查询失败。\n可能是当前网络拦截了外部 API。";
    }
  };
}

/* =========================
   DNS
   ========================= */

function openDNS(){

  openModal(
    "DNS 查询",
    "网络",
    `
    <div class="tool-form">

      <input
        id="dnsName"
        placeholder="例如 example.com"
      >

      <select id="dnsType">
        <option value="A">A</option>
        <option value="AAAA">AAAA</option>
        <option value="CNAME">CNAME</option>
        <option value="MX">MX</option>
        <option value="TXT">TXT</option>
      </select>

      <button class="tool-action" id="dnsRun">
        查询 DNS
      </button>

      <div id="dnsResult" class="result">
        等待查询…
      </div>

    </div>
    `
  );

  $("#dnsRun").onclick = async () => {

    const name =
      $("#dnsName").value.trim();

    const type =
      $("#dnsType").value;

    const result =
      $("#dnsResult");

    if(!name){

      result.className = "result error";
      result.textContent = "请输入域名。";
      return;
    }

    result.className = "result";
    result.textContent = "查询中…";

    try{

      const url =
        `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;

      const r =
        await fetch(url);

      const data =
        await r.json();

      if(!data.Answer){

        result.textContent =
          "没有返回记录。";

        return;
      }

      result.className =
        "result good";

      result.textContent =
        data.Answer
          .map(x => x.data)
          .join("\n");

    }catch{

      result.className =
        "result error";

      result.textContent =
        "DNS 查询失败。";
    }
  };
}

/* =========================
   HTTP
   ========================= */

function openHTTP(){

  openModal(
    "HTTP 检测",
    "网络",
    `
    <div class="tool-form">

      <input
        id="httpUrl"
        placeholder="https://example.com"
      >

      <button class="tool-action" id="httpRun">
        开始检测
      </button>

      <div id="httpResult" class="result">
        注意：浏览器跨域策略可能阻止部分网站检测。
      </div>

    </div>
    `
  );

  $("#httpRun").onclick = async () => {

    let url =
      $("#httpUrl").value.trim();

    const result =
      $("#httpResult");

    if(!url){
      result.textContent = "请输入 URL。";
      return;
    }

    if(!/^https?:\/\//i.test(url)){
      url = "https://" + url;
    }

    result.textContent =
      "请求中…";

    const start =
      performance.now();

    try{

      const response =
        await fetch(
          url,
          {
            method:"HEAD",
            mode:"cors",
            cache:"no-store"
          }
        );

      const ms =
        Math.round(
          performance.now() - start
        );

      result.className =
        "result good";

      result.textContent =
        `状态码：${response.status}\n` +
        `耗时：${ms} ms\n` +
        `状态：${response.statusText || "OK"}`;

    }catch{

      result.className =
        "result error";

      result.textContent =
        "请求失败。\n" +
        "可能原因：CORS、目标站禁止跨域或网络不可达。";
    }
  };
}

/* =========================
   HEADERS
   ========================= */

function openHeaders(){

  const nav =
    navigator;

  const headers = [
    ["User-Agent", nav.userAgent],
    ["Language", nav.language],
    ["Platform", nav.platform],
    ["Online", nav.onLine ? "true" : "false"],
    ["Cookies", navigator.cookieEnabled ? "enabled" : "disabled"]
  ];

  openModal(
    "Headers / Browser Info",
    "网络",
    `
    <div class="result good">${
      headers
        .map(x => `${x[0]}: ${x[1]}`)
        .join("\n")
    }</div>
    `
  );
}

/* =========================
   NETWORK INFO
   ========================= */

function openNetwork(){

  const c =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  const info = {

    online:
      navigator.onLine,

    type:
      c?.type || "unknown",

    effectiveType:
      c?.effectiveType || "unknown",

    downlink:
      c?.downlink
        ? `${c.downlink} Mbps`
        : "unknown",

    rtt:
      c?.rtt
        ? `${c.rtt} ms`
        : "unknown",

    saveData:
      c?.saveData ?? "unknown"
  };

  openModal(
    "网络信息",
    "网络",
    `
    <div class="result">${
      Object.entries(info)
        .map(([k,v]) => `${k}: ${v}`)
        .join("\n")
    }</div>
    `
  );
}

/* =========================
   HTTP PING
   ========================= */

function openPing(){

  openModal(
    "HTTP Ping",
    "网络",
    `
    <div class="tool-form">

      <input
        id="pingUrl"
        value="https://example.com"
      >

      <button
        class="tool-action"
        id="pingRun"
      >
        Ping
      </button>

      <div
        id="pingResult"
        class="result"
      >
        等待测试…
      </div>

    </div>
    `
  );

  $("#pingRun").onclick =
    async () => {

      let url =
        $("#pingUrl").value.trim();

      if(!/^https?:\/\//i.test(url)){
        url = "https://" + url;
      }

      const result =
        $("#pingResult");

      const start =
        performance.now();

      result.textContent =
        "测试中…";

      try{

        await fetch(
          url,
          {
            method:"HEAD",
            mode:"no-cors",
            cache:"no-store"
          }
        );

        const ms =
          Math.round(
            performance.now() - start
          );

        result.className =
          "result good";

        result.textContent =
          `响应耗时约 ${ms} ms\n` +
          `注意：no-cors 模式无法读取目标 HTTP 状态码。`;

      }catch{

        result.className =
          "result error";

        result.textContent =
          "请求失败。";
      }
    };
}

/* =========================
   JSON
   ========================= */

function openJSON(){

  openModal(
    "JSON 工具",
    "开发",
    `
    <div class="tool-form">

      <textarea
        id="jsonInput"
        placeholder='{"hello":"world"}'
      ></textarea>

      <div class="tool-row">

        <button
          class="tool-action"
          id="jsonFormat"
        >
          格式化
        </button>

        <button
          class="tool-action secondary"
          id="jsonMinify"
        >
          压缩
        </button>

      </div>

      <div id="jsonResult" class="result">
        结果显示在这里。
      </div>

    </div>
    `
  );

  function run(format){

    const input =
      $("#jsonInput").value;

    const result =
      $("#jsonResult");

    try{

      const obj =
        JSON.parse(input);

      result.className =
        "result good";

      result.textContent =
        format
          ? JSON.stringify(obj,null,2)
          : JSON.stringify(obj);

    }catch(e){

      result.className =
        "result error";

      result.textContent =
        "JSON 无效：\n" +
        e.message;
    }
  }

  $("#jsonFormat").onclick =
    () => run(true);

  $("#jsonMinify").onclick =
    () => run(false);
}

/* =========================
   BASE64
   ========================= */

function openBase64(){

  openModal(
    "Base64",
    "开发",
    `
    <div class="tool-form">

      <textarea
        id="baseInput"
        placeholder="输入文本"
      ></textarea>

      <div class="tool-row">

        <button
          class="tool-action"
          id="baseEncode"
        >
          编码
        </button>

        <button
          class="tool-action secondary"
          id="baseDecode"
        >
          解码
        </button>

      </div>

      <div id="baseResult" class="result">
        结果显示在这里。
      </div>

    </div>
    `
  );

  $("#baseEncode").onclick =
    () => {

      try{

        const text =
          $("#baseInput").value;

        const bytes =
          new TextEncoder().encode(text);

        let binary = "";

        bytes.forEach(
          b => binary += String.fromCharCode(b)
        );

        $("#baseResult").textContent =
          btoa(binary);

        $("#baseResult").className =
          "result good";

      }catch{

        $("#baseResult").textContent =
          "编码失败。";
      }
    };

  $("#baseDecode").onclick =
    () => {

      try{

        const binary =
          atob($("#baseInput").value.trim());

        const bytes =
          Uint8Array.from(
            binary,
            c => c.charCodeAt(0)
          );

        $("#baseResult").textContent =
          new TextDecoder().decode(bytes);

        $("#baseResult").className =
          "result good";

      }catch{

        $("#baseResult").textContent =
          "Base64 无效。";

        $("#baseResult").className =
          "result error";
      }
    };
}

/* =========================
   URL
   ========================= */

function openURL(){

  openModal(
    "URL 编解码",
    "开发",
    `
    <div class="tool-form">

      <textarea
        id="urlInput"
        placeholder="输入 URL 或文本"
      ></textarea>

      <div class="tool-row">

        <button
          class="tool-action"
          id="urlEncode"
        >
          Encode
        </button>

        <button
          class="tool-action secondary"
          id="urlDecode"
        >
          Decode
        </button>

      </div>

      <div id="urlResult" class="result"></div>

    </div>
    `
  );

  $("#urlEncode").onclick =
    () => {

      $("#urlResult").textContent =
        encodeURIComponent(
          $("#urlInput").value
        );
    };

  $("#urlDecode").onclick =
    () => {

      try{

        $("#urlResult").textContent =
          decodeURIComponent(
            $("#urlInput").value
          );

      }catch{

        $("#urlResult").textContent =
          "解码失败。";
      }
    };
}

/* =========================
   JWT
   ========================= */

function openJWT(){

  openModal(
    "JWT 解码",
    "开发",
    `
    <div class="tool-form">

      <textarea
        id="jwtInput"
        placeholder="eyJhbGciOi..."
      ></textarea>

      <button
        class="tool-action"
        id="jwtRun"
      >
        解码 Payload
      </button>

      <div
        id="jwtResult"
        class="result"
      ></div>

    </div>
    `
  );

  $("#jwtRun").onclick =
    () => {

      const token =
        $("#jwtInput").value.trim();

      try{

        const parts =
          token.split(".");

        if(parts.length < 2){
          throw new Error("不是有效 JWT");
        }

        let payload =
          parts[1]
            .replace(/-/g,"+")
            .replace(/_/g,"/");

        while(payload.length % 4){
          payload += "=";
        }

        const binary =
          atob(payload);

        const bytes =
          Uint8Array.from(
            binary,
            c => c.charCodeAt(0)
          );

        const json =
          JSON.parse(
            new TextDecoder().decode(bytes)
          );

        $("#jwtResult").className =
          "result good";

        $("#jwtResult").textContent =
          JSON.stringify(json,null,2);

      }catch(e){

        $("#jwtResult").className =
          "result error";

        $("#jwtResult").textContent =
          "JWT 解码失败：\n" +
          e.message;
      }
    };
}

/* =========================
   HASH
   ========================= */

async function hashText(text, algorithm){

  const data =
    new TextEncoder().encode(text);

  const buffer =
    await crypto.subtle.digest(
      algorithm,
      data
    );

  return [...new Uint8Array(buffer)]
    .map(
      b => b.toString(16).padStart(2,"0")
    )
    .join("");
}

function openHash(){

  openModal(
    "Hash 计算",
    "开发",
    `
    <div class="tool-form">

      <textarea
        id="hashInput"
        placeholder="输入文本"
      ></textarea>

      <select id="hashType">
        <option value="SHA-256">SHA-256</option>
        <option value="SHA-1">SHA-1</option>
      </select>

      <button
        class="tool-action"
        id="hashRun"
      >
        计算 Hash
      </button>

      <div
        id="hashResult"
        class="result"
      ></div>

    </div>
    `
  );

  $("#hashRun").onclick =
    async () => {

      const result =
        $("#hashResult");

      try{

        result.textContent =
          "计算中…";

        result.textContent =
          await hashText(
            $("#hashInput").value,
            $("#hashType").value
          );

        result.className =
          "result good";

      }catch{

        result.className =
          "result error";

        result.textContent =
          "计算失败。";
      }
    };
}
/* =========================
   REGEX
   ========================= */

function openRegex(){

  openModal(
    "正则测试",
    "开发",
    `
    <div class="tool-form">

      <input
        id="regexPattern"
        placeholder="正则，例如 ^hello"
      >

      <input
        id="regexFlags"
        placeholder="flags，例如 gi"
      >

      <textarea
        id="regexText"
        placeholder="输入测试文本"
      ></textarea>

      <button
        class="tool-action"
        id="regexRun"
      >
        测试
      </button>

      <div
        id="regexResult"
        class="result"
      ></div>

    </div>
    `
  );

  $("#regexRun").onclick =
    () => {

      const result =
        $("#regexResult");

      try{

        const regex =
          new RegExp(
            $("#regexPattern").value,
            $("#regexFlags").value
          );

        const text =
          $("#regexText").value;

        const matches =
          text.match(regex);

        if(!matches){

          result.textContent =
            "没有匹配。";

          result.className =
            "result";
          return;
        }

        result.className =
          "result good";

        result.textContent =
          `匹配成功\n\n${matches.join("\n")}`;

      }catch(e){

        result.className =
          "result error";

        result.textContent =
          e.message;
      }
    };
}

/* =========================
   UUID
   ========================= */

function openUUID(){

  openModal(
    "UUID 生成器",
    "实用",
    `
    <div class="tool-form">

      <button
        class="tool-action"
        id="uuidRun"
      >
        生成 UUID
      </button>

      <div
        id="uuidResult"
        class="result"
      ></div>

    </div>
    `
  );

  $("#uuidRun").onclick =
    () => {

      $("#uuidResult").textContent =
        crypto.randomUUID();

      $("#uuidResult").className =
        "result good";

      addXP(3);
    };
}

/* =========================
   PASSWORD
   ========================= */

function randomPassword(length){

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

  const values =
    new Uint32Array(length);

  crypto.getRandomValues(values);

  return [...values]
    .map(v => chars[v % chars.length])
    .join("");
}

function openPassword(){

  openModal(
    "随机密码",
    "实用",
    `
    <div class="tool-form">

      <input
        id="passLength"
        type="number"
        min="6"
        max="64"
        value="16"
      >

      <button
        class="tool-action"
        id="passRun"
      >
        生成
      </button>

      <div
        id="passResult"
        class="result"
      ></div>

    </div>
    `
  );

  $("#passRun").onclick =
    () => {

      let length =
        Number($("#passLength").value);

      length =
        Math.max(
          6,
          Math.min(64,length)
        );

      $("#passResult").textContent =
        randomPassword(length);

      $("#passResult").className =
        "result good";
    };
}

/* =========================
   TIME
   ========================= */

function openTime(){

  const now =
    Math.floor(Date.now()/1000);

  openModal(
    "时间转换",
    "实用",
    `
    <div class="tool-form">

      <input
        id="timeInput"
        type="text"
        value="${now}"
      >

      <div class="tool-row">

        <button
          class="tool-action"
          id="unixToDate"
        >
          Unix → 日期
        </button>

        <button
          class="tool-action secondary"
          id="dateToUnix"
        >
          当前日期 → Unix
        </button>

      </div>

      <div
        id="timeResult"
        class="result"
      ></div>

    </div>
    `
  );

  $("#unixToDate").onclick =
    () => {

      const n =
        Number($("#timeInput").value);

      if(!Number.isFinite(n)){
        $("#timeResult").textContent =
          "请输入 Unix 时间戳。";
        return;
      }

      $("#timeResult").textContent =
        new Date(n*1000).toLocaleString();
    };

  $("#dateToUnix").onclick =
    () => {

      $("#timeResult").textContent =
        Math.floor(Date.now()/1000);
    };
}
/* =========================
   TEXT
   ========================= */

function openText(){

  openModal(
    "文本统计",
    "实用",
    `
    <div class="tool-form">

      <textarea
        id="textInput"
        placeholder="输入文本"
      ></textarea>

      <button
        class="tool-action"
        id="textRun"
      >
        统计
      </button>

      <div
        id="textResult"
        class="result"
      ></div>

    </div>
    `
  );

  $("#textRun").onclick =
    () => {

      const text =
        $("#textInput").value;

      const chars =
        [...text].length;

      const noSpace =
        [...text.replace(/\s/g,"")].length;

      const words =
        text.trim()
          ? text.trim().split(/\s+/).length
          : 0;

      const lines =
        text
          ? text.split(/\r?\n/).length
          : 0;

      $("#textResult").textContent =
        `字符数：${chars}\n` +
        `去空格字符：${noSpace}\n` +
        `单词数：${words}\n` +
        `行数：${lines}`;
    };
}

/* =========================
   COLOR
   ========================= */

function openColor(){

  openModal(
    "颜色工具",
    "实用",
    `
    <div class="tool-form">

      <input
        id="colorInput"
        value="#7c9cff"
        placeholder="#7c9cff"
      >

      <button
        class="tool-action"
        id="colorRun"
      >
        转换
      </button>

      <div
        id="colorPreview"
        style="
          height:90px;
          border-radius:12px;
          border:1px solid var(--line);
        "
      ></div>

      <div
        id="colorResult"
        class="result"
      ></div>

    </div>
    `
  );

  $("#colorRun").onclick =
    () => {

      let hex =
        $("#colorInput")
          .value
          .trim()
          .replace("#","");

      if(
        !/^[0-9a-fA-F]{6}$/.test(hex)
      ){

        $("#colorResult").className =
          "result error";

        $("#colorResult").textContent =
          "请输入 6 位 HEX，例如 #7c9cff";

        return;
      }

      const r =
        parseInt(hex.slice(0,2),16);

      const g =
        parseInt(hex.slice(2,4),16);

      const b =
        parseInt(hex.slice(4,6),16);

      const rgb =
        `rgb(${r}, ${g}, ${b})`;

      $("#colorPreview").style.background =
        `#${hex}`;

      $("#colorResult").className =
        "result good";

      $("#colorResult").textContent =
        `HEX: #${hex.toUpperCase()}\n` +
        `RGB: ${rgb}`;
    };
}
/* =========================
   QR
   ========================= */

function openQR(){

  openModal(
    "二维码",
    "实用",
    `
    <div class="tool-form">

      <input
        id="qrInput"
        placeholder="输入网址或文本"
      >

      <button
        class="tool-action"
        id="qrRun"
      >
        生成二维码
      </button>

      <div
        id="qrResult"
        class="result"
        style="text-align:center"
      >
        输入内容后生成。
      </div>

    </div>
    `
  );

  $("#qrRun").onclick =
    () => {

      const value =
        $("#qrInput").value.trim();

      if(!value){

        $("#qrResult").textContent =
          "请输入内容。";

        return;
      }

      const url =
        "https://api.qrserver.com/v1/create-qr-code/" +
        `?size=260x260&data=${encodeURIComponent(value)}`;

      $("#qrResult").innerHTML =
        `<img
          src="${url}"
          alt="QR Code"
          style="
            max-width:260px;
            width:100%;
            border-radius:10px;
          "
        >`;
    };
}

/* =========================
   DAILY CHALLENGE
   ========================= */

const challenges = [
  {
    id:"ip",
    title:"查询一次你的公网 IP",
    xp:20
  },
  {
    id:"dns",
    title:"做一次 DNS 查询",
    xp:20
  },
  {
    id:"json",
    title:"格式化一段 JSON",
    xp:20
  },
  {
    id:"uuid",
    title:"生成一个 UUID",
    xp:20
  },
  {
    id:"hash",
    title:"计算一次 SHA-256",
    xp:20
  },
  {
    id:"color",
    title:"使用颜色工具",
    xp:20
  }
];

function getChallenge(){

  const day =
    new Date().getDate();

  return challenges[
    day % challenges.length
  ];
}

function renderChallenge(){

  const challenge =
    getChallenge();

  const root =
    $("#challengeCard");

  if(!root) return;

  root.className =
    "challenge " +
    (state.challengeDone ? "done" : "");

  root.innerHTML = `
    <div class="challenge-inner">

      <div class="challenge-icon">
        ${state.challengeDone ? "✓" : "🎯"}
      </div>

      <div class="challenge-text">
        <b>
          ${state.challengeDone
            ? "今日挑战已完成"
            : challenge.title}
        </b>

        <small>
          ${state.challengeDone
            ? "明天继续"
            : `完成可获得 ${challenge.xp} XP`}
        </small>
      </div>

    </div>
  `;
}

function checkChallenge(toolId){

  const challenge =
    getChallenge();

  if(
    !state.challengeDone &&
    challenge.id === toolId
  ){

    state.challengeDone = true;

    saveState();

    addXP(challenge.xp);

    toast(
      `🎯 每日挑战完成 +${challenge.xp} XP`
    );
  }
}

/* =========================
   GAMES
   ========================= */

$$("[data-game]").forEach(
  card => {

    card.addEventListener(
      "click",
      () => {

        const game =
          card.dataset.game;

        if(game === "reaction")
          reactionGame();

        if(game === "typing")
          typingGame();

        if(game === "color")
          colorGame();

        if(game === "quiz")
          quizGame();
      }
    );

  }
);

/* REACTION */

function reactionGame(){

  openModal(
    "反应力挑战",
    "Playground",
    `
    <div class="game-big">

      <p>
        等待绿色出现后立即点击。
      </p>

      <div
        id="reactionBox"
        class="reaction-box wait"
      >
        点击开始
      </div>

      <p id="reactionResult">
        -
      </p>

    </div>
    `
  );

  const box =
    $("#reactionBox");

  let start = 0;
  let timer = null;

  box.onclick = () => {

    if(box.classList.contains("go")){

      const ms =
        Math.round(
          performance.now() - start
        );

      box.className =
        "reaction-box wait";

      box.textContent =
        `${ms} ms`;

      $("#reactionResult").textContent =
        ms < 250
          ? "非常快！"
          : ms < 400
            ? "不错！"
            : "继续练习。";

      addXP(
        ms < 300 ? 30 : 15
      );

      clearTimeout(timer);

      return;
    }

    box.textContent =
      "等待绿色…";

    box.className =
      "reaction-box wait";

    const delay =
      1000 + Math.random()*3000;

    timer =
      setTimeout(() => {

        box.className =
          "reaction-box go";

        box.textContent =
          "现在点！";

        start =
          performance.now();

      },delay);
  };
}

/* TYPING */

function typingGame(){

  const texts = [
    "hello world",
    "lzdsg network lab",
    "javascript is fun",
    "test your speed",
    "network toolbox"
  ];

  const target =
    texts[
      Math.floor(
        Math.random()*texts.length
      )
    ];

  openModal(
    "打字挑战",
    "Playground",
    `
    <div class="game-big">

      <p>尽快输入：</p>

      <h3>${target}</h3>

      <div class="tool-form">

        <input
          id="typingInput"
          autocomplete="off"
          placeholder="开始输入…"
        >

        <div
          id="typingResult"
          class="result"
        >
          等待输入。
        </div>

      </div>

    </div>
    `
  );

  const input =
    $("#typingInput");

  const start =
    performance.now();

  input.focus();

  input.addEventListener(
    "input",
    () => {

      if(input.value === target){

        const ms =
          Math.round(
            performance.now()-start
          );

        const seconds =
          (ms/1000).toFixed(2);

        $("#typingResult").className =
          "result good";

        $("#typingResult").textContent =
          `完成！用时 ${seconds} 秒`;

        addXP(30);
      }
    }
  );
}

/* COLOR GAME */

function colorGame(){

  const colors = [
    "#ff6b6b",
    "#6b9cff",
    "#6be7a8",
    "#ffd166",
    "#b07cff",
    "#ff8ac2"
  ];

  const target =
    colors[
      Math.floor(
        Math.random()*colors.length
      )
    ];

  const options =
    [...colors]
      .sort(() => Math.random()-.5);

  openModal(
    "颜色猎人",
    "Playground",
    `
    <div class="game-big">

      <p>找到这个颜色：</p>

      <div
        style="
          width:70px;
          height:70px;
          margin:15px auto;
          border-radius:50%;
          background:${target};
        "
      ></div>

      <div class="color-options">

        ${options.map(
          color => `
            <button
              class="color-choice"
              data-color="${color}"
              style="background:${color}"
            ></button>
          `
        ).join("")}

      </div>

      <div
        id="colorGameResult"
        class="result"
      >
        -
      </div>

    </div>
    `
  );

  $$(".color-choice").forEach(
    button => {

      button.onclick = () => {

        const correct =
          button.dataset.color === target;

        const result =
          $("#colorGameResult");

        if(correct){

          result.className =
            "result good";

          result.textContent =
            "✓ 找到了！ +25 XP";

          addXP(25);

        }else{

          result.className =
            "result error";

          result.textContent =
            "✕ 不对，再试试。";
        }
      };
    }
  );
}

/* QUIZ */

function quizGame(){

  const questions = [

    {
      q:"DNS 主要用于什么？",
      a:[
        "域名解析",
        "压缩图片",
        "加密硬盘",
        "生成 UUID"
      ],
      correct:0
    },

    {
      q:"HTTP 200 通常代表什么？",
      a:[
        "请求成功",
        "服务器错误",
        "未找到",
        "永久重定向"
      ],
      correct:0
    },

    {
      q:"IPv4 地址通常由多少个八位组组成？",
      a:[
        "4",
        "2",
        "6",
        "8"
      ],
      correct:0
    }

  ];

  const item =
    questions[
      Math.floor(
        Math.random()*questions.length
      )
    ];

  openModal(
    "网络问答",
    "Playground",
    `
    <div class="game-big">

      <h3>${item.q}</h3>

      <div id="quizOptions">

        ${item.a.map(
          (answer,i) => `
            <button
              class="quiz-option"
              data-index="${i}"
            >
              ${answer}
            </button>
          `
        ).join("")}

      </div>

      <div
        id="quizResult"
        class="result"
      >
        选择一个答案。
      </div>

    </div>
    `
  );

  $$(".quiz-option").forEach(
    button => {

      button.onclick = () => {

        const index =
          Number(button.dataset.index);

        const result =
          $("#quizResult");

        if(index === item.correct){

          result.className =
            "result good";

          result.textContent =
            "✓ 正确！ +25 XP";

          addXP(25);

        }else{

          result.className =
            "result error";

          result.textContent =
            "✕ 错了，再试一次。";
        }
      };
    }
  );
}

/* =========================
   THEME
   ========================= */

function applySettings(){

  document.body.classList.toggle(
    "light",
    state.theme === "light"
  );

  document.body.classList.toggle(
    "lowfx",
    state.lowfx
  );

  $("#themeBtn").textContent =
    state.theme === "light"
      ? "☾"
      : "☼";

  $("#fxBtn").textContent =
    state.lowfx
      ? "○"
      : "✦";
}

$("#themeBtn").onclick =
  () => {

    state.theme =
      state.theme === "dark"
        ? "light"
        : "dark";

    saveState();
    applySettings();
  };

$("#fxBtn").onclick =
  () => {

    state.lowfx =
      !state.lowfx;

    saveState();
    applySettings();

    toast(
      state.lowfx
        ? "低特效模式已开启"
        : "低特效模式已关闭"
    );
  };

/* =========================
   TOAST
   ========================= */

let toastTimer;

function toast(message){

  const el =
    $("#toast");

  el.textContent =
    message;

  el.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer =
    setTimeout(
      () => el.classList.remove("show"),
      1800
    );
}

/* =========================
   INIT
   ========================= */

function init(){

  applySettings();

  renderTools();

  renderRecent();

  updateDashboard();

  renderChallenge();
}

init();
