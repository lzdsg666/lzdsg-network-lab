const $ = id => document.getElementById(id);

const settings = {
    effects: true,
    click: true,
    cursor: true,
    particle: true
};

function scrollToTop(){
    window.scrollTo({top:0,behavior:"smooth"});
}

function scrollToSection(id){
    $(id)?.scrollIntoView({
        behavior:"smooth"
    });
}

/* =========================
   时钟
========================= */

function updateClock(){
    $("clock").textContent =
        new Date().toLocaleString("zh-CN",{
            month:"2-digit",
            day:"2-digit",
            hour:"2-digit",
            minute:"2-digit",
            second:"2-digit",
            hour12:false
        });
}

updateClock();
setInterval(updateClock,1000);


/* =========================
   搜索
========================= */

function searchTools(){

    const q =
        $("searchInput").value
        .trim()
        .toLowerCase();

    document.querySelectorAll(".tool").forEach(tool=>{

        const name =
            (tool.dataset.name || "").toLowerCase();

        tool.style.display =
            !q || name.includes(q)
            ? ""
            : "none";
    });
}


/* =========================
   特效开关
========================= */

function setSwitch(id,on){
    $(id)?.classList.toggle("on",on);
}

function toggleSetting(type){

    settings[type] = !settings[type];

    if(type === "effects"){

        document.body.classList.toggle(
            "effects-on",
            settings.effects
        );

        document.body.classList.toggle(
            "effects-off",
            !settings.effects
        );
    }

    if(type === "cursor"){
        $("cursorGlow").style.display =
            settings.cursor && settings.effects
            ? ""
            : "none";
    }

    if(type === "particle"){
        particleEnabled =
            settings.particle &&
            settings.effects;
    }

    const map = {
        effects:"effectsSwitch",
        click:"clickSwitch",
        cursor:"cursorSwitch",
        particle:"particleSwitch"
    };

    setSwitch(map[type],settings[type]);
}

function toggleTheme(){

    document.body.classList.toggle("light");

    setSwitch(
        "themeSwitch",
        !document.body.classList.contains("light")
    );
}


/* =========================
   鼠标光效
========================= */

document.addEventListener("pointerdown", e => {

    if (
        !settings.effects ||
        !settings.click
    ) return;

    /*
     * 弹窗打开时，不在弹窗内部生成点击粒子
     * 避免粒子层影响弹窗视觉和交互
     */
    if (
        e.target.closest &&
        e.target.closest(".modal-box")
    ) {
        return;
    }

    createBurst(
        e.clientX,
        e.clientY
    );
});


/* =========================
   点击离子
========================= */

document.addEventListener("pointerdown",e=>{

    if(
        !settings.effects ||
        !settings.click
    ) return;

    createBurst(
        e.clientX,
        e.clientY
    );
});

function createBurst(x,y){

    for(let i=0;i<18;i++){

        const p =
            document.createElement("span");

        p.className="burst";

        p.style.left=x+"px";
        p.style.top=y+"px";

        const angle =
            Math.random()*Math.PI*2;

        const distance =
            35+Math.random()*85;

        p.style.setProperty(
            "--x",
            Math.cos(angle)*distance+"px"
        );

        p.style.setProperty(
            "--y",
            Math.sin(angle)*distance+"px"
        );

        document.body.appendChild(p);

        setTimeout(
            ()=>p.remove(),
            700
        );
    }
}


/* =========================
   背景粒子
========================= */

const canvas=$("particles");
const ctx=canvas.getContext("2d");

let particles=[];
let particleEnabled=true;

function resizeCanvas(){

    canvas.width =
        innerWidth*devicePixelRatio;

    canvas.height =
        innerHeight*devicePixelRatio;

    canvas.style.width =
        innerWidth+"px";

    canvas.style.height =
        innerHeight+"px";

    ctx.setTransform(
        devicePixelRatio,
        0,0,
        devicePixelRatio,
        0,0
    );
}

function initParticles(){

    particles=[];

    const amount =
        Math.min(
            90,
            Math.floor(innerWidth/15)
        );

    for(let i=0;i<amount;i++){

        particles.push({
            x:Math.random()*innerWidth,
            y:Math.random()*innerHeight,
            vx:(Math.random()-.5)*.3,
            vy:(Math.random()-.5)*.3,
            r:Math.random()*1.7+.3,
            a:Math.random()*.55+.15
        });
    }
}

function animateParticles(){

    ctx.clearRect(
        0,0,
        innerWidth,
        innerHeight
    );

    if(
        particleEnabled &&
        settings.effects
    ){

        for(const p of particles){

            p.x+=p.vx;
            p.y+=p.vy;

            if(p.x<0)p.x=innerWidth;
            if(p.x>innerWidth)p.x=0;
            if(p.y<0)p.y=innerHeight;
            if(p.y>innerHeight)p.y=0;

            ctx.beginPath();

            ctx.fillStyle =
                `rgba(0,210,255,${p.a})`;

            ctx.arc(
                p.x,
                p.y,
                p.r,
                0,
                Math.PI*2
            );

            ctx.fill();
        }

        for(let i=0;i<particles.length;i++){

            for(let j=i+1;j<particles.length;j++){

                const a=particles[i];
                const b=particles[j];

                const dx=a.x-b.x;
                const dy=a.y-b.y;

                const distance =
                    Math.sqrt(dx*dx+dy*dy);

                if(distance<115){

                    ctx.beginPath();

                    ctx.strokeStyle =
                        `rgba(0,150,255,${
                            (1-distance/115)*.12
                        })`;

                    ctx.moveTo(a.x,a.y);
                    ctx.lineTo(b.x,b.y);
                    ctx.stroke();
                }
            }
        }
    }

    requestAnimationFrame(
        animateParticles
    );
}

resizeCanvas();
initParticles();
animateParticles();

window.addEventListener(
    "resize",
    ()=>{
        resizeCanvas();
        initParticles();
    }
);


/* =========================
   弹窗
========================= */

function openTool(type){

    /* 先让被点击的卡片退出 hover / GPU 合成 */
    document.body.classList.add("modal-open");

    document.querySelectorAll(".tool").forEach(tool => {
        tool.style.transform = "none";
        tool.style.transition = "none";
        tool.style.willChange = "auto";
    });

    $("modal").classList.add("show");

    const tools={
        ip:{
            title:"🌐 IP 查询",
            html:`
                <p>查询当前公网 IPv4 / IPv6。</p>
                <div class="actions">
                    <button class="btn" onclick="getIP()">
                        🔍 查询
                    </button>
                </div>
                <div class="result" id="toolResult">
                    等待查询
                </div>`
        },

        dns:{
            title:"🔎 DNS 查询",
            html:`
                <div class="field">
                    <label>域名</label>
                    <input id="dnsDomain"
                           placeholder="example.com">
                </div>

                <div class="field">
                    <label>类型</label>
                    <select id="dnsType">
                        <option>A</option>
                        <option>AAAA</option>
                        <option>CNAME</option>
                        <option>MX</option>
                        <option>TXT</option>
                        <option>NS</option>
                    </select>
                </div>

                <button class="btn"
                        onclick="dnsQuery()">
                    查询 DNS
                </button>

                <div class="result" id="toolResult">
                    等待查询
                </div>`
        },

        ping:{
            title:"📡 Ping / 延迟测试",
            html:`
                <div class="field">
                    <label>网址</label>
                    <input id="pingUrl"
                           placeholder="https://example.com">
                </div>

                <button class="btn"
                        onclick="pingTest()">
                    开始测试
                </button>

                <div class="result" id="toolResult">
                    等待测试
                </div>`
        },

        http:{
            title:"HTTP 网站检测",
            html:`
                <div class="field">
                    <label>网址</label>
                    <input id="httpUrl"
                           placeholder="https://example.com">
                </div>

                <button class="btn"
                        onclick="httpTest()">
                    检测
                </button>

                <div class="result" id="toolResult">
                    等待检测
                </div>`
        },

        headers:{
            title:"📋 浏览器信息",
            html:`
                <div class="result">
                    User-Agent:
                    ${navigator.userAgent}

                    <br><br>
                    Language:
                    ${navigator.language}

                    <br>
                    Platform:
                    ${navigator.platform}

                    <br>
                    Online:
                    ${navigator.onLine}
                </div>`
        },

        network:{
            title:"📊 网络信息",
            html:`
                <div class="result">
                    Online:
                    ${navigator.onLine}

                    <br><br>
                    Connection:
                    ${navigator.connection?.effectiveType || "未知"}

                    <br><br>
                    Downlink:
                    ${navigator.connection?.downlink || "未知"} Mbps

                    <br><br>
                    RTT:
                    ${navigator.connection?.rtt || "未知"} ms
                </div>`
        },

        json:{
            title:"⌘ JSON 工具",
            html:`
                <div class="field">
                    <textarea id="jsonInput"
placeholder='{"name":"LZDSG","version":2}'></textarea>
                </div>

                <div class="actions">
                    <button class="btn"
                            onclick="formatJSON()">
                        格式化
                    </button>

                    <button class="btn"
                            onclick="minifyJSON()">
                        压缩
                    </button>

                    <button class="btn"
                            onclick="copyResult()">
                        📋 复制
                    </button>
                </div>

                <div class="result" id="toolResult">
                    等待处理
                </div>`
        },

        base64:{
            title:"🔐 Base64",
            html:`
                <div class="field">
                    <textarea id="base64Input"
placeholder="输入文字"></textarea>
                </div>

                <div class="actions">
                    <button class="btn"
                            onclick="base64Encode()">
                        编码
                    </button>

                    <button class="btn"
                            onclick="base64Decode()">
                        解码
                    </button>
                </div>

                <div class="result" id="toolResult">
                    等待处理
                </div>`
        },

        url:{
            title:"🔗 URL 编解码",
            html:`
                <div class="field">
                    <textarea id="urlInput"></textarea>
                </div>

                <div class="actions">
                    <button class="btn"
                            onclick="urlEncodeTool()">
                        Encode
                    </button>

                    <button class="btn"
                            onclick="urlDecodeTool()">
                        Decode
                    </button>
                </div>

                <div class="result" id="toolResult">
                    等待处理
                </div>`
        },

        jwt:{
            title:"🪪 JWT Decoder",
            html:`
                <div class="field">
                    <textarea id="jwtInput"
placeholder="粘贴 JWT Token"></textarea>
                </div>

                <button class="btn"
                        onclick="decodeJWT()">
                    解析
                </button>

                <div class="result" id="toolResult">
                    等待解析
                </div>`
        },

        hash:{
            title:"#️⃣ Hash 计算",
            html:`
                <div class="field">
                    <textarea id="hashInput"></textarea>
                </div>

                <div class="actions">
                    <button class="btn"
                            onclick="hashText('SHA-256')">
                        SHA-256
                    </button>

                    <button class="btn"
                            onclick="hashText('SHA-1')">
                        SHA-1
                    </button>
                </div>

                <div class="result" id="toolResult">
                    等待计算
                </div>`
        },

        regex:{
            title:".* 正则测试",
            html:`
                <div class="field">
                    <input id="regexPattern"
                           placeholder="^[a-z]+$">
                </div>

                <div class="field">
                    <textarea id="regexText"></textarea>
                </div>

                <button class="btn"
                        onclick="regexTest()">
                    测试
                </button>

                <div class="result" id="toolResult">
                    等待测试
                </div>`
        },

        uuid:{
            title:"🆔 UUID",
            html:`
                <button class="btn"
                        onclick="generateUUID()">
                    生成 UUID
                </button>

                <button class="btn"
                        onclick="copyResult()">
                    📋 复制
                </button>

                <div class="result" id="toolResult">
                    点击生成
                </div>`
        },

        password:{
            title:"🔑 随机密码",
            html:`
                <div class="field">
                    <input id="passwordLength"
                           type="number"
                           value="20"
                           min="6"
                           max="128">
                </div>

                <button class="btn"
                        onclick="generatePassword()">
                    生成密码
                </button>

                <div class="result" id="toolResult">
                    点击生成
                </div>`
        },

        time:{
            title:"🕐 时间戳",
            html:`
                <div class="field">
                    <input id="timestamp"
                           placeholder="Unix 时间戳">
                </div>

                <button class="btn"
                        onclick="timestampTool()">
                    转换
                </button>

                <div class="result" id="toolResult">
                    等待转换
                </div>`
        },

        qr:{
            title:"▦ 二维码",
            html:`
                <div class="field">
                    <input id="qrInput"
                           placeholder="输入网址或文字">
                </div>

                <button class="btn"
                        onclick="generateQR()">
                    生成二维码
                </button>

                <div class="result"
                     id="toolResult">
                    等待生成
                </div>`
        },

        text:{
            title:"Aa 文本统计",
            html:`
                <div class="field">
                    <textarea id="textInput"></textarea>
                </div>

                <button class="btn"
                        onclick="textStats()">
                    统计
                </button>

                <div class="result" id="toolResult">
                    等待统计
                </div>`
        },

        color:{
            title:"🎨 颜色工具",
            html:`
                <div class="field">
                    <input id="colorInput"
                           type="color"
                           value="#00e5ff"
                           style="height:70px">
                </div>

                <button class="btn"
                        onclick="colorTool()">
                    获取颜色
                </button>

                <div class="result" id="toolResult">
                    #00e5ff
                </div>`
        }
    };

    $("modalTitle").textContent=tools[type].title;
    $("modalContent").innerHTML=tools[type].html;
}

function closeTool(){
    $("modal").classList.remove("show");
}

function modalBackground(e){
    if(e.target === $("modal")){
        closeTool();
    }
}

document.addEventListener("keydown",e=>{
    if(e.key==="Escape") closeTool();
});


/* =========================
   IP
========================= */

async function getIP(){

    const result=$("toolResult");
    result.textContent="查询中...";

    try{

        const [a,b]=await Promise.allSettled([
            fetch("https://api.ipify.org?format=json")
                .then(r=>r.json()),
            fetch("https://api64.ipify.org?format=json")
                .then(r=>r.json())
        ]);

        let text="";

        if(a.status==="fulfilled")
            text+="IPv4: "+a.value.ip;

        if(b.status==="fulfilled")
            text+="\nIPv6: "+b.value.ip;

        result.textContent=text||"查询失败";

    }catch(e){
        result.textContent="查询失败";
    }
}


/* =========================
   DNS
========================= */

async function dnsQuery(){

    const domain=$("dnsDomain").value.trim();
    const type=$("dnsType").value;
    const result=$("toolResult");

    if(!domain){
        result.textContent="请输入域名";
        return;
    }

    result.textContent="查询中...";

    try{

        const url=
            "https://cloudflare-dns.com/dns-query"+
            "?name="+encodeURIComponent(domain)+
            "&type="+type;

        const response=
            await fetch(url,{
                headers:{
                    accept:"application/dns-json"
                }
            });

        const data=await response.json();

        if(!data.Answer){
            result.textContent="没有找到记录";
            return;
        }

        result.textContent=
            data.Answer
            .map(x=>`${x.name} → ${x.data}`)
            .join("\n");

    }catch(e){
        result.textContent="DNS 查询失败";
    }
}


/* =========================
   Ping
========================= */

async function pingTest(){

    let url=$("pingUrl").value.trim();
    const result=$("toolResult");

    if(!url){
        result.textContent="请输入网址";
        return;
    }

    if(!/^https?:\/\//i.test(url))
        url="https://"+url;

    const start=performance.now();

    try{

        await fetch(url,{
            method:"HEAD",
            mode:"no-cors",
            cache:"no-store"
        });

        const ms=performance.now()-start;

        result.textContent=
            `请求完成\n\n约 ${ms.toFixed(1)} ms\n\n浏览器跨域限制下，该结果不等于 ICMP Ping。`;

    }catch(e){

        result.textContent=
            "请求失败："+e.message;
    }
}


/* =========================
   HTTP
========================= */

async function httpTest(){

    let url=$("httpUrl").value.trim();
    const result=$("toolResult");

    if(!url){
        result.textContent="请输入网址";
        return;
    }

    if(!/^https?:\/\//i.test(url))
        url="https://"+url;

    const start=performance.now();

    try{

        await fetch(url,{
            method:"HEAD",
            mode:"no-cors",
            cache:"no-store"
        });

        const ms=performance.now()-start;

        result.textContent=
            `请求成功发出\n耗时约 ${ms.toFixed(1)} ms\n\nCORS 限制下无法读取真实 HTTP 状态码。`;

    }catch(e){

        result.textContent="请求失败";
    }
}


/* =========================
   JSON
========================= */

function formatJSON(){

    try{

        const obj=
            JSON.parse($("jsonInput").value);

        $("toolResult").textContent=
            JSON.stringify(obj,null,2);

    }catch(e){

        $("toolResult").textContent=
            "JSON 错误："+e.message;
    }
}

function minifyJSON(){

    try{

        const obj=
            JSON.parse($("jsonInput").value);

        $("toolResult").textContent=
            JSON.stringify(obj);

    }catch(e){

        $("toolResult").textContent=
            "JSON 错误："+e.message;
    }
}


/* =========================
   Base64
========================= */

function base64Encode(){

    const text=$("base64Input").value;

    const bytes=
        new TextEncoder().encode(text);

    let binary="";

    bytes.forEach(
        x=>binary+=String.fromCharCode(x)
    );

    $("toolResult").textContent=
        btoa(binary);
}

function base64Decode(){

    try{

        const binary=
            atob($("base64Input").value);

        const bytes=
            Uint8Array.from(
                binary,
                x=>x.charCodeAt(0)
            );

        $("toolResult").textContent=
            new TextDecoder().decode(bytes);

    }catch(e){

        $("toolResult").textContent=
            "Base64 格式错误";
    }
}


/* =========================
   URL
========================= */

function urlEncodeTool(){

    $("toolResult").textContent=
        encodeURIComponent(
            $("urlInput").value
        );
}

function urlDecodeTool(){

    try{

        $("toolResult").textContent=
            decodeURIComponent(
                $("urlInput").value
            );

    }catch(e){

        $("toolResult").textContent=
            "URL 格式错误";
    }
}


/* =========================
   JWT
========================= */

function decodeJWT(){

    try{

        const token=
            $("jwtInput").value.trim();

        const parts=token.split(".");

        if(parts.length!==3)
            throw new Error("JWT 格式错误");

        const decodePart=part=>{

            part=
                part.replace(/-/g,"+")
                    .replace(/_/g,"/");

            while(part.length%4)
                part+="=";

            return JSON.parse(
                decodeURIComponent(
                    atob(part)
                    .split("")
                    .map(c=>
                        "%"+
                        ("00"+
                        c.charCodeAt(0)
                        .toString(16))
                        .slice(-2)
                    )
                    .join("")
                )
            );
        };

        const header=decodePart(parts[0]);
        const payload=decodePart(parts[1]);

        $("toolResult").textContent=
            "HEADER\n"+
            JSON.stringify(header,null,2)+
            "\n\nPAYLOAD\n"+
            JSON.stringify(payload,null,2);

    }catch(e){

        $("toolResult").textContent=
            "JWT 解析失败："+e.message;
    }
}


/* =========================
   HASH
========================= */

async function hashText(algorithm){

    const text=$("hashInput").value;

    const buffer=
        await crypto.subtle.digest(
            algorithm,
            new TextEncoder().encode(text)
        );

    const hash=
        [...new Uint8Array(buffer)]
        .map(x=>x.toString(16).padStart(2,"0"))
        .join("");

    $("toolResult").textContent=hash;
}


/* =========================
   REGEX
========================= */

function regexTest(){

    try{

        const pattern=
            $("regexPattern").value;

        const text=
            $("regexText").value;

        const regex=new RegExp(pattern);
        const matches=text.match(regex);

        $("toolResult").textContent=
            matches
            ? "匹配成功：\n"+matches.join("\n")
            : "没有匹配";

    }catch(e){

        $("toolResult").textContent=
            "正则错误："+e.message;
    }
}


/* =========================
   UUID
========================= */

function generateUUID(){

    $("toolResult").textContent=
        crypto.randomUUID();
}


/* =========================
   PASSWORD
========================= */

function generatePassword(){

    let length=
        Number($("passwordLength").value);

    length=
        Math.max(6,Math.min(128,length));

    const chars=
        "ABCDEFGHJKLMNPQRSTUVWXYZ"+
        "abcdefghijkmnopqrstuvwxyz"+
        "23456789!@#$%^&*_-+=";

    const values=
        new Uint32Array(length);

    crypto.getRandomValues(values);

    let password="";

    for(let i=0;i<length;i++){
        password+=
            chars[values[i]%chars.length];
    }

    $("toolResult").textContent=password;
}


/* =========================
   TIME
========================= */

function timestampTool(){

    let value=
        $("timestamp").value.trim();

    if(!value){
        value=
            Math.floor(Date.now()/1000);
    }

    const date=
        new Date(Number(value)*1000);

    if(isNaN(date.getTime())){
        $("toolResult").textContent="时间戳错误";
        return;
    }

    $("toolResult").textContent=
        "Unix："+
        Math.floor(date.getTime()/1000)+
        "\n\n本地："+
        date.toLocaleString("zh-CN")+
        "\n\nUTC："+
        date.toUTCString();
}


/* =========================
   QR
========================= */

function generateQR(){

    const text=$("qrInput").value.trim();

    if(!text){
        $("toolResult").textContent="请输入内容";
        return;
    }

    const url=
        "https://api.qrserver.com/v1/create-qr-code/"+
        "?size=220x220&data="+
        encodeURIComponent(text);

    $("toolResult").innerHTML=
        `<img src="${url}"
              alt="QR Code"
              style="max-width:220px;background:#fff;padding:8px;border-radius:12px">`;
}


/* =========================
   TEXT
========================= */

function textStats(){

    const text=$("textInput").value;

    const chars=text.length;
    const noSpace=
        text.replace(/\s/g,"").length;

    const lines=
        text ? text.split(/\r?\n/).length : 0;

    const words=
        text.trim()
        ? text.trim().split(/\s+/).length
        : 0;

    $("toolResult").textContent=
        `字符数：${chars}
去空白：${noSpace}
行数：${lines}
分词：${words}`;
}


/* =========================
   COLOR
========================= */

function colorTool(){

    const color=$("colorInput").value;

    $("toolResult").textContent=
        `HEX: ${color}\n\nCSS:\ncolor: ${color};`;
}


/* =========================
   COPY
========================= */

async function copyResult(){

    const result=$("toolResult");

    if(!result)return;

    try{

        await navigator.clipboard.writeText(
            result.textContent
        );

        showToast("✓ 已复制");

    }catch(e){

        showToast("复制失败");
    }
}


/* =========================
   Toast
========================= */

function showToast(text){

    const toast=$("toast");

    toast.textContent=text;
    toast.classList.add("show");

    clearTimeout(window.toastTimer);

    window.toastTimer=
        setTimeout(
            ()=>toast.classList.remove("show"),
            1200
        );
}


/* =========================
   页面初始化
========================= */

document.addEventListener("DOMContentLoaded",()=>{

    document.body.classList.add("effects-on");

    console.log(
        "%cLZDSG NETWORK LAB",
        "color:#00e5ff;font-size:20px;font-weight:bold"
    );

});
/* =========================================================
   LIQUID GLASS
   鼠标移动时改变玻璃高光位置
========================================================= */

const glassElements = document.querySelectorAll(
    ".hero, .tool, .status, .sidebar, .modal-box"
);

document.addEventListener("pointermove", e => {

    if (!settings.effects) return;

    const x = `${(e.clientX / window.innerWidth) * 100}%`;
    const y = `${(e.clientY / window.innerHeight) * 100}%`;

    glassElements.forEach(el => {
        el.style.setProperty("--glass-x", x);
        el.style.setProperty("--glass-y", y);
    });

});


/* =========================================================
   特效状态初始化
========================================================= */

document.body.classList.toggle(
    "effects-on",
    settings.effects
);

document.body.classList.toggle(
    "effects-off",
    !settings.effects
);

setSwitch(
    "effectsSwitch",
    settings.effects
);


/* =========================================================
   保存总特效开关
========================================================= */

const originalToggleSetting = toggleSetting;

toggleSetting = function(type) {

    originalToggleSetting(type);

    if (type === "effects") {

        localStorage.setItem(
            "lzdsg-effects",
            settings.effects ? "on" : "off"
        );

    }

};


/* =========================================================
   恢复上次的特效状态
========================================================= */

const savedEffects =
    localStorage.getItem("lzdsg-effects");

if (savedEffects !== null) {

    settings.effects =
        savedEffects !== "off";

    document.body.classList.toggle(
        "effects-on",
        settings.effects
    );

    document.body.classList.toggle(
        "effects-off",
        !settings.effects
    );

    setSwitch(
        "effectsSwitch",
        settings.effects
    );

    if ($("cursorGlow")) {

        $("cursorGlow").style.display =
            settings.effects &&
            settings.cursor
                ? ""
                : "none";

    }

    particleEnabled =
        settings.effects &&
        settings.particle;

}