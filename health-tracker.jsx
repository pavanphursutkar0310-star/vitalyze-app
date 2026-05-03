import { useState, useEffect, useRef } from "react";

// ─── Config ───────────────────────────────────────────────
const BACKEND = "https://vitalyze-backend-uylp.onrender.com";
const MOODS = ["😞","😕","😐","🙂","😄"];
const MOOD_LABELS = ["Rough","Low","Okay","Good","Great"];
const MOOD_COLORS = ["#c47a7a","#c49a6c","#9e9e7a","#7a9e7e","#4a9e7a"];
const DEFAULT_ROUTINE = [
  {id:1,time:"06:30",label:"Wake up & Stretch",icon:"🌅",done:false},
  {id:2,time:"07:00",label:"Morning Walk / Run",icon:"🏃",done:false},
  {id:3,time:"08:00",label:"Healthy Breakfast",icon:"🥗",done:false},
  {id:4,time:"12:30",label:"Drink 2 glasses water",icon:"💧",done:false},
  {id:5,time:"13:00",label:"Lunch",icon:"🍱",done:false},
  {id:6,time:"17:00",label:"Evening Exercise",icon:"💪",done:false},
  {id:7,time:"19:30",label:"Dinner",icon:"🍽️",done:false},
  {id:8,time:"22:00",label:"Wind down",icon:"🌙",done:false},
  {id:9,time:"22:30",label:"Sleep",icon:"😴",done:false},
];
const ADMIN_PASS = "vitalyze2025";

// ─── Storage ──────────────────────────────────────────────
const uKey = (u,k) => `vz_${u}_${k}`;
const uGet = (u,k,d) => { try{const v=localStorage.getItem(uKey(u,k));return v?JSON.parse(v):d;}catch{return d;} };
const uSet = (u,k,v) => localStorage.setItem(uKey(u,k),JSON.stringify(v));
const getUsers = () => { try{return JSON.parse(localStorage.getItem("vz_users")||"{}");}catch{return{};} };
const saveUsers = u => localStorage.setItem("vz_users",JSON.stringify(u));
const getSession = () => { try{return JSON.parse(localStorage.getItem("vz_session")||"null");}catch{return null;} };
const saveSession = u => localStorage.setItem("vz_session",JSON.stringify(u));
const clearSession = () => localStorage.removeItem("vz_session");

// ─── API ──────────────────────────────────────────────────
async function callAI(messages, system) {
  try {
    const res = await fetch(`${BACKEND}/claude`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({messages, system}),
    });
    const data = await res.json();
    return data.content?.[0]?.text || "Sorry, couldn't respond right now.";
  } catch {
    return "Backend se connect nahi ho paya. Please try again.";
  }
}

async function scanFood(base64) {
  try {
    const res = await fetch(`${BACKEND}/scan-food`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({imageBase64: base64}),
    });
    return await res.json();
  } catch {
    return {error:"Could not analyze. Try again."};
  }
}

// ═══════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════
export default function Root() {
  const [user, setUser] = useState(() => getSession());
  const [adminMode, setAdminMode] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    fetch(`${BACKEND}/`).then(r=>r.json())
      .then(()=>setBackendStatus("online"))
      .catch(()=>setBackendStatus("offline"));
  }, []);

  if (adminMode) return <AdminPanel onExit={()=>setAdminMode(false)} />;
  if (!user) return <AuthScreen onLogin={u=>{saveSession(u);setUser(u);}} onAdmin={()=>setAdminMode(true)} backendStatus={backendStatus} />;
  return <MainApp user={user} onLogout={()=>{clearSession();setUser(null);}} backendStatus={backendStatus} />;
}

// ═══════════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════════
function AuthScreen({onLogin, onAdmin, backendStatus}) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function submit() {
    setError("");
    if (!email.includes("@")) { setError("Valid email daalo"); return; }
    if (pass.length < 6) { setError("Password min 6 characters"); return; }
    if (mode==="signup" && !name.trim()) { setError("Naam daalo"); return; }
    setLoading(true);
    setTimeout(() => {
      const users = getUsers();
      const key = email.toLowerCase().trim();
      if (mode==="signup") {
        if (users[key]) { setError("Account already exists. Login karo."); setLoading(false); return; }
        users[key] = {name:name.trim(), email:key, password:pass, joinedAt:Date.now()};
        saveUsers(users);
        onLogin({name:name.trim(), email:key});
      } else {
        if (!users[key]) { setError("Account nahi mila. Sign up karo."); setLoading(false); return; }
        if (users[key].password !== pass) { setError("Password galat hai."); setLoading(false); return; }
        onLogin({name:users[key].name, email:key});
      }
      setLoading(false);
    }, 500);
  }

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0f1e,#0d1b2a,#0a1628)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"Georgia,serif",color:"#e8dcc8"}}>
      {/* Backend status */}
      <div style={{position:"absolute",top:16,right:16,display:"flex",alignItems:"center",gap:6,fontSize:11,color:backendStatus==="online"?"#7a9e7e":backendStatus==="offline"?"#c47a7a":"#c49a6c"}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:backendStatus==="online"?"#7a9e7e":backendStatus==="offline"?"#c47a7a":"#c49a6c",animation:backendStatus==="checking"?"pulse 1s infinite":""}} />
        Backend {backendStatus==="online"?"Live ✓":backendStatus==="offline"?"Offline ✗":"Checking..."}
      </div>

      {/* Logo */}
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:52,marginBottom:8}}>💚</div>
        <h1 style={{margin:0,fontSize:30,fontWeight:"normal",color:"#f0e6d3",letterSpacing:"-0.02em"}}>Vitalyze <span style={{color:"#7a9e7e"}}>✦</span> AI</h1>
        <div style={{fontSize:11,letterSpacing:"0.2em",color:"#7a9e7e",marginTop:4,textTransform:"uppercase"}}>Your Personal Health Intelligence</div>
      </div>

      {/* Card */}
      <div style={{width:"100%",maxWidth:360,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"26px 22px"}}>
        {/* Toggle */}
        <div style={{display:"flex",background:"rgba(0,0,0,0.3)",borderRadius:10,padding:3,marginBottom:20}}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"9px",border:"none",borderRadius:8,background:mode===m?"rgba(122,158,126,0.4)":"transparent",color:mode===m?"#e8dcc8":"rgba(232,220,200,0.4)",fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
              {m==="login"?"Sign In":"Sign Up"}
            </button>
          ))}
        </div>

        {mode==="signup" && (
          <div style={{marginBottom:12}}>
            <div style={labelSt}>Full Name</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tumhara naam" style={inpSt} />
          </div>
        )}
        <div style={{marginBottom:12}}>
          <div style={labelSt}>Email</div>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" type="email" style={inpSt} />
        </div>
        <div style={{marginBottom:18}}>
          <div style={labelSt}>Password</div>
          <div style={{position:"relative"}}>
            <input value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="••••••••" type={showPass?"text":"password"} style={{...inpSt,paddingRight:40}} />
            <button onClick={()=>setShowPass(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"rgba(232,220,200,0.4)",fontSize:14}}>{showPass?"🙈":"👁"}</button>
          </div>
        </div>

        {error && <div style={{background:"rgba(196,100,100,0.15)",border:"1px solid rgba(196,100,100,0.3)",borderRadius:8,padding:"8px 12px",marginBottom:14,fontSize:12,color:"#e8a0a0"}}>⚠ {error}</div>}

        <button onClick={submit} disabled={loading} style={{width:"100%",padding:13,background:loading?"rgba(122,158,126,0.3)":"rgba(122,158,126,0.85)",border:"none",borderRadius:10,color:"#0a0f1e",fontSize:14,fontWeight:"700",cursor:loading?"not-allowed":"pointer",fontFamily:"inherit"}}>
          {loading?"Please wait…":mode==="login"?"Sign In →":"Create Account →"}
        </button>

        <div style={{textAlign:"center",marginTop:12,fontSize:11,color:"rgba(232,220,200,0.3)"}}>
          {mode==="login"?"No account? ":"Have account? "}
          <span onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");}} style={{color:"#7a9e7e",cursor:"pointer"}}>
            {mode==="login"?"Sign Up":"Sign In"}
          </span>
        </div>
      </div>

      <button onClick={onAdmin} style={{marginTop:20,background:"none",border:"none",color:"rgba(232,220,200,0.15)",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
        Admin Panel
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ADMIN PANEL
// ═══════════════════════════════════════════════════════════
function AdminPanel({onExit}) {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("overview");

  const users = getUsers();
  const userList = Object.values(users);
  const allLogs = userList.flatMap(u => uGet(u.email,"logs",[]).map(l=>({...l,userName:u.name,userEmail:u.email})));
  const allCals = userList.flatMap(u => uGet(u.email,"calories",[]).map(c=>({...c,userName:u.name})));
  const totalLogs = allLogs.length;
  const totalScans = allCals.length;
  const avgMood = allLogs.length ? (allLogs.reduce((s,l)=>s+(l.mood||0),0)/allLogs.length).toFixed(1) : "—";
  const avgSleep = allLogs.length ? (allLogs.reduce((s,l)=>s+(l.sleep||0),0)/allLogs.length).toFixed(1) : "—";

  if (!authed) return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",color:"#e8dcc8"}}>
      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:16,padding:28,width:300}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:32}}>🛡️</div>
          <div style={{fontSize:18,color:"#f0e6d3",marginTop:6}}>Admin Access</div>
        </div>
        <input value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(pw===ADMIN_PASS?setAuthed(true):setErr("Wrong password"))} type="password" placeholder="Admin password" style={{...inpSt,marginBottom:12}} />
        {err && <div style={{color:"#e8a0a0",fontSize:12,marginBottom:10}}>⚠ {err}</div>}
        <button onClick={()=>pw===ADMIN_PASS?setAuthed(true):setErr("Wrong password")} style={{width:"100%",padding:12,background:"rgba(122,158,126,0.85)",border:"none",borderRadius:10,color:"#0a0f1e",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",fontSize:14}}>
          Enter
        </button>
        <button onClick={onExit} style={{width:"100%",padding:10,background:"none",border:"none",color:"rgba(232,220,200,0.3)",cursor:"pointer",fontFamily:"inherit",marginTop:8,fontSize:12}}>
          ← Back
        </button>
      </div>
    </div>
  );

  const ADMIN_TABS = [{id:"overview",label:"Overview",icon:"📊"},{id:"users",label:"Users",icon:"👥"},{id:"logs",label:"Health Logs",icon:"📋"},{id:"backend",label:"Backend",icon:"🖥️"}];

  return (
    <div style={{minHeight:"100vh",background:"#080d18",fontFamily:"Georgia,serif",color:"#e8dcc8"}}>
      {/* Header */}
      <div style={{background:"rgba(122,158,126,0.1)",borderBottom:"1px solid rgba(122,158,126,0.2)",padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:10,letterSpacing:"0.25em",color:"#7a9e7e",textTransform:"uppercase"}}>Vitalyze AI</div>
          <div style={{fontSize:18,color:"#f0e6d3"}}>🛡️ Admin Panel</div>
        </div>
        <button onClick={onExit} style={{padding:"8px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"rgba(232,220,200,0.6)",cursor:"pointer",fontFamily:"inherit",fontSize:12}}>
          ← Exit
        </button>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(0,0,0,0.3)"}}>
        {ADMIN_TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 4px",background:"none",border:"none",borderBottom:tab===t.id?"2px solid #7a9e7e":"2px solid transparent",color:tab===t.id?"#e8dcc8":"rgba(232,220,200,0.35)",fontSize:10,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <span style={{fontSize:14}}>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{padding:16,maxWidth:600,margin:"0 auto"}}>

        {/* OVERVIEW */}
        {tab==="overview" && (
          <div>
            <div style={{fontSize:10,letterSpacing:"0.2em",color:"#7a9e7e",marginBottom:12,textTransform:"uppercase"}}>App Statistics</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              {[
                {icon:"👥",label:"Total Users",value:userList.length},
                {icon:"📋",label:"Health Logs",value:totalLogs},
                {icon:"🍽️",label:"Food Scans",value:totalScans},
                {icon:"😊",label:"Avg Mood",value:avgMood==="—"?avgMood:MOOD_LABELS[Math.round(parseFloat(avgMood))]},
                {icon:"🌙",label:"Avg Sleep",value:avgSleep+"h"},
                {icon:"📅",label:"Active Today",value:allLogs.filter(l=>l.date===new Date().toDateString()).length},
              ].map(s=>(
                <div key={s.label} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:14,textAlign:"center"}}>
                  <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
                  <div style={{fontSize:22,fontWeight:"700",color:"#f0e6d3"}}>{s.value}</div>
                  <div style={{fontSize:9,color:"rgba(232,220,200,0.4)",marginTop:2,textTransform:"uppercase",letterSpacing:"0.1em"}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent activity */}
            <div style={{fontSize:10,letterSpacing:"0.2em",color:"#7a9e7e",marginBottom:10,textTransform:"uppercase"}}>Recent Activity</div>
            {allLogs.slice(0,5).map((log,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,marginBottom:6}}>
                <div>
                  <div style={{fontSize:13,color:"#e8dcc8"}}>{log.userName}</div>
                  <div style={{fontSize:10,color:"rgba(232,220,200,0.35)"}}>{log.date} · Sleep {log.sleep}h · Water {log.water}gl</div>
                </div>
                <span style={{fontSize:18}}>{MOODS[log.mood]}</span>
              </div>
            ))}
            {allLogs.length===0 && <div style={{textAlign:"center",padding:30,color:"rgba(232,220,200,0.3)",fontSize:13}}>No logs yet</div>}
          </div>
        )}

        {/* USERS */}
        {tab==="users" && (
          <div>
            <div style={{fontSize:10,letterSpacing:"0.2em",color:"#7a9e7e",marginBottom:12,textTransform:"uppercase"}}>{userList.length} Registered Users</div>
            {userList.length===0 && <div style={{textAlign:"center",padding:30,color:"rgba(232,220,200,0.3)",fontSize:13}}>No users yet</div>}
            {userList.map((u,i)=>{
              const logs = uGet(u.email,"logs",[]);
              const cals = uGet(u.email,"calories",[]);
              return (
                <div key={i} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:14,marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(122,158,126,0.2)",border:"1px solid rgba(122,158,126,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:"700",color:"#7a9e7e"}}>
                      {u.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontSize:14,color:"#f0e6d3"}}>{u.name}</div>
                      <div style={{fontSize:11,color:"rgba(232,220,200,0.4)"}}>{u.email}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    {[{l:"Logs",v:logs.length},{l:"Food Scans",v:cals.length},{l:"Joined",v:u.joinedAt?new Date(u.joinedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):"—"}].map(s=>(
                      <div key={s.l} style={{flex:1,background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"7px",textAlign:"center"}}>
                        <div style={{fontSize:14,fontWeight:"700",color:"#7a9e7e"}}>{s.v}</div>
                        <div style={{fontSize:9,color:"rgba(232,220,200,0.35)"}}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* HEALTH LOGS */}
        {tab==="logs" && (
          <div>
            <div style={{fontSize:10,letterSpacing:"0.2em",color:"#7a9e7e",marginBottom:12,textTransform:"uppercase"}}>{allLogs.length} Total Health Logs</div>
            {allLogs.slice(0,20).map((log,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"11px 13px",marginBottom:7}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <div>
                    <span style={{fontSize:13,color:"#e8dcc8"}}>{log.userName}</span>
                    <span style={{fontSize:10,color:"rgba(232,220,200,0.35)",marginLeft:8}}>{log.date}</span>
                  </div>
                  <span style={{fontSize:16}}>{MOODS[log.mood]}</span>
                </div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap",fontSize:11,color:"rgba(232,220,200,0.55)"}}>
                  <span>🌙 {log.sleep}h</span>
                  <span>💧 {log.water}gl</span>
                  <span>🏃 {log.exercise}m</span>
                  {log.symptoms&&<span style={{color:"#c49a6c"}}>⚠ {log.symptoms}</span>}
                </div>
              </div>
            ))}
            {allLogs.length===0 && <div style={{textAlign:"center",padding:30,color:"rgba(232,220,200,0.3)",fontSize:13}}>No logs yet</div>}
          </div>
        )}

        {/* BACKEND STATUS */}
        {tab==="backend" && (
          <div>
            <div style={{fontSize:10,letterSpacing:"0.2em",color:"#7a9e7e",marginBottom:12,textTransform:"uppercase"}}>Backend Health Check</div>
            <BackendChecker />
          </div>
        )}
      </div>
    </div>
  );
}

function BackendChecker() {
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState(false);

  async function runTests() {
    setTesting(true);
    setResults({});
    // Test 1: Health check
    try {
      const r = await fetch(`${BACKEND}/`);
      const d = await r.json();
      setResults(p=>({...p, health:{ok:true,msg:d.status}}));
    } catch(e) {
      setResults(p=>({...p, health:{ok:false,msg:e.message}}));
    }
    // Test 2: AI chat
    try {
      const r = await fetch(`${BACKEND}/claude`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:"Say hello in 5 words"}]})});
      const d = await r.json();
      const text = d.content?.[0]?.text;
      setResults(p=>({...p, ai:{ok:!!text,msg:text||"No response"}}));
    } catch(e) {
      setResults(p=>({...p, ai:{ok:false,msg:e.message}}));
    }
    setTesting(false);
  }

  return (
    <div>
      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:14,marginBottom:12}}>
        <div style={{fontSize:12,color:"rgba(232,220,200,0.6)",marginBottom:8}}>Backend URL:</div>
        <div style={{fontSize:12,color:"#7a9e7e",fontFamily:"monospace",wordBreak:"break-all"}}>{BACKEND}</div>
      </div>

      <button onClick={runTests} disabled={testing} style={{width:"100%",padding:12,background:testing?"rgba(122,158,126,0.3)":"rgba(122,158,126,0.85)",border:"none",borderRadius:10,color:"#0a0f1e",fontWeight:"700",cursor:testing?"not-allowed":"pointer",fontFamily:"inherit",fontSize:14,marginBottom:12}}>
        {testing?"Testing…":"🔍 Run Backend Tests"}
      </button>

      {Object.entries(results).map(([key,r])=>(
        <div key={key} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",background:r.ok?"rgba(122,158,126,0.08)":"rgba(196,100,100,0.08)",border:`1px solid ${r.ok?"rgba(122,158,126,0.25)":"rgba(196,100,100,0.25)"}`,borderRadius:10,marginBottom:7}}>
          <span style={{fontSize:16,flexShrink:0}}>{r.ok?"✅":"❌"}</span>
          <div>
            <div style={{fontSize:12,fontWeight:"700",color:r.ok?"#7a9e7e":"#e8a0a0",textTransform:"capitalize"}}>{key==="health"?"Health Check":"AI Response"}</div>
            <div style={{fontSize:11,color:"rgba(232,220,200,0.5)",marginTop:2}}>{r.msg}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════
function MainApp({user, onLogout, backendStatus}) {
  const u = user.email;
  const [logs, setLogsR] = useState(()=>uGet(u,"logs",[]));
  const [routine, setRoutineR] = useState(()=>uGet(u,"routine",DEFAULT_ROUTINE));
  const [calorieLogs, setCalorieLogsR] = useState(()=>uGet(u,"calories",[]));
  const [form, setForm] = useState({mood:2,sleep:7,water:6,exercise:0,notes:"",symptoms:""});
  const [aiChat, setAiChat] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("log");
  const [showProfile, setShowProfile] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [newTask, setNewTask] = useState({time:"",label:"",icon:"⭐"});
  const [showAddTask, setShowAddTask] = useState(false);
  const [foodImg, setFoodImg] = useState(null);
  const [foodB64, setFoodB64] = useState(null);
  const [calResult, setCalResult] = useState(null);
  const [calLoading, setCalLoading] = useState(false);
  const fileRef = useRef(null);
  const chatEndRef = useRef(null);

  const setLogs = v => { const n=typeof v==="function"?v(logs):v; setLogsR(n); uSet(u,"logs",n); };
  const setRoutine = v => { const n=typeof v==="function"?v(routine):v; setRoutineR(n); uSet(u,"routine",n); };
  const setCalorieLogs = v => { const n=typeof v==="function"?v(calorieLogs):v; setCalorieLogsR(n); uSet(u,"calories",n); };

  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:"smooth"}); },[aiChat]);

  const todayStr = new Date().toDateString();
  const todayLogged = logs.some(l=>l.date===todayStr);
  const todayDone = routine.filter(r=>r.done).length;
  const todayCals = calorieLogs.filter(l=>l.date===todayStr).reduce((s,l)=>s+(l.calories||0),0);
  const avg = key => logs.length?(logs.reduce((s,l)=>s+(l[key]||0),0)/logs.length).toFixed(1):"—";

  async function handleLog() {
    const entry = {...form,date:todayStr,timestamp:Date.now()};
    const newLogs = [entry,...logs.filter(l=>l.date!==todayStr)];
    setLogs(newLogs);
    setLoading(true);
    const summary = newLogs.slice(0,5).map(l=>`${l.date}: mood ${MOOD_LABELS[l.mood]}, sleep ${l.sleep}h, water ${l.water}gl, exercise ${l.exercise}min${l.symptoms?`, symptoms:${l.symptoms}`:""}${l.notes?`, note:${l.notes}`:""}`).join("\n");
    const reply = await callAI([{role:"user",content:`My health log:\n${summary}\n\nGive brief personalized insight.`}]);
    setLoading(false);
    setAiChat([{role:"assistant",content:reply,auto:true}]);
    setView("chat");
  }

  async function handleChat() {
    if (!aiInput.trim()) return;
    const userMsg = {role:"user",content:aiInput};
    const newChat = [...aiChat,userMsg];
    setAiChat(newChat);
    setAiInput("");
    setLoading(true);
    const ctx = logs.length?`User health data:\n${logs.slice(0,5).map(l=>`${l.date}: mood ${MOOD_LABELS[l.mood]}, sleep ${l.sleep}h, water ${l.water}gl, exercise ${l.exercise}min`).join("\n")}\n\n`:"";
    const msgs = newChat.map(m=>({role:m.role,content:m.content}));
    msgs[msgs.length-1].content = ctx+aiInput;
    const reply = await callAI(msgs);
    setLoading(false);
    setAiChat([...newChat,{role:"assistant",content:reply}]);
  }

  function handleFoodPick(e) {
    const file = e.target.files[0]; if(!file) return;
    setFoodImg(URL.createObjectURL(file));
    setCalResult(null);
    const reader = new FileReader();
    reader.onload = ev => setFoodB64(ev.target.result.split(",")[1]);
    reader.readAsDataURL(file);
  }

  async function handleScan() {
    if (!foodB64) return;
    setCalLoading(true); setCalResult(null);
    const result = await scanFood(foodB64);
    setCalResult(result);
    if (!result.error) {
      setCalorieLogs(prev=>[{...result,date:todayStr,time:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}),timestamp:Date.now()},...prev].slice(0,50));
    }
    setCalLoading(false);
  }

  function delAccount() {
    const users = getUsers(); delete users[u]; saveUsers(users);
    ["logs","routine","calories"].forEach(k=>localStorage.removeItem(uKey(u,k)));
    onLogout();
  }

  const TABS = [{id:"log",label:"Log",icon:"📋"},{id:"calories",label:"Calories",icon:"🍽️"},{id:"routine",label:"Routine",icon:"📅"},{id:"history",label:"History",icon:"📊"},{id:"chat",label:"AI Coach",icon:"🤖"}];

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0f1e,#0d1b2a,#0a1628)",fontFamily:"Georgia,serif",color:"#e8dcc8"}}>
      {showProfile && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:100,display:"flex",alignItems:"flex-end"}} onClick={()=>{setShowProfile(false);setShowDel(false);}}>
          <div style={{width:"100%",background:"#0d1b2a",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"20px 20px 0 0",padding:22}} onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:"center",marginBottom:18}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(122,158,126,0.2)",border:"2px solid rgba(122,158,126,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,margin:"0 auto 8px",color:"#7a9e7e",fontWeight:"700"}}>{user.name[0].toUpperCase()}</div>
              <div style={{fontSize:16,color:"#f0e6d3"}}>{user.name}</div>
              <div style={{fontSize:11,color:"rgba(232,220,200,0.4)"}}>{user.email}</div>
              <div style={{fontSize:11,color:backendStatus==="online"?"#7a9e7e":"#c47a7a",marginTop:4}}>Backend: {backendStatus==="online"?"🟢 Live":"🔴 Offline"}</div>
            </div>
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"10px 14px",marginBottom:10}}>
              {[["📋 Health Logs",logs.length],["🍽️ Food Scans",calorieLogs.length],["📅 Routine Tasks",routine.length]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"rgba(232,220,200,0.7)",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                  <span>{l}</span><span style={{color:"#7a9e7e"}}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={onLogout} style={{width:"100%",padding:11,background:"rgba(122,158,126,0.15)",border:"1px solid rgba(122,158,126,0.3)",borderRadius:10,color:"#7a9e7e",fontSize:13,cursor:"pointer",fontFamily:"inherit",marginBottom:7}}>Sign Out</button>
            {!showDel
              ? <button onClick={()=>setShowDel(true)} style={{width:"100%",padding:11,background:"rgba(196,100,100,0.08)",border:"1px solid rgba(196,100,100,0.2)",borderRadius:10,color:"rgba(220,120,120,0.8)",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Delete Account</button>
              : <div style={{background:"rgba(196,100,100,0.1)",border:"1px solid rgba(196,100,100,0.3)",borderRadius:10,padding:12}}>
                  <div style={{fontSize:12,color:"rgba(220,200,200,0.9)",marginBottom:8,textAlign:"center"}}>⚠ Sab data delete ho jayega!</div>
                  <div style={{display:"flex",gap:7}}>
                    <button onClick={delAccount} style={{flex:1,padding:9,background:"rgba(196,80,80,0.5)",border:"none",borderRadius:8,color:"#fff",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Yes, Delete</button>
                    <button onClick={()=>setShowDel(false)} style={{flex:1,padding:9,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"rgba(232,220,200,0.6)",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                  </div>
                </div>
            }
            <button onClick={()=>{setShowProfile(false);setShowDel(false);}} style={{width:"100%",padding:9,background:"none",border:"none",color:"rgba(232,220,200,0.25)",fontSize:12,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>Close</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{borderBottom:"1px solid rgba(232,220,200,0.1)",padding:"13px 15px 10px",background:"rgba(255,255,255,0.02)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:9,letterSpacing:"0.25em",color:"#7a9e7e",textTransform:"uppercase",marginBottom:2}}>Your Personal Health Intelligence</div>
          <h1 style={{margin:0,fontSize:19,fontWeight:"normal",color:"#f0e6d3"}}>Vitalyze <span style={{color:"#7a9e7e"}}>✦</span> AI</h1>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {todayCals>0&&<div style={{fontSize:11,color:"#c49a6c"}}>🔥{todayCals}</div>}
          <div style={{width:6,height:6,borderRadius:"50%",background:backendStatus==="online"?"#7a9e7e":backendStatus==="offline"?"#c47a7a":"#c49a6c"}} title={`Backend ${backendStatus}`} />
          <button onClick={()=>setShowProfile(true)} style={{width:34,height:34,borderRadius:"50%",background:"rgba(122,158,126,0.2)",border:"1px solid rgba(122,158,126,0.35)",color:"#7a9e7e",fontSize:14,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"700"}}>
            {user.name[0].toUpperCase()}
          </button>
        </div>
      </div>

      {/* Nav */}
      <div style={{display:"flex",borderBottom:"1px solid rgba(232,220,200,0.07)",background:"rgba(0,0,0,0.2)"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setView(t.id)} style={{flex:1,padding:"8px 2px",background:"none",border:"none",borderBottom:view===t.id?"2px solid #7a9e7e":"2px solid transparent",color:view===t.id?"#e8dcc8":"rgba(232,220,200,0.35)",fontSize:9,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <span style={{fontSize:13}}>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{padding:"13px 13px 110px",maxWidth:480,margin:"0 auto"}}>

        {/* ── LOG ── */}
        {view==="log"&&(
          <div>
            {todayLogged&&<div style={alSt}>✓ Already logged today — update to overwrite</div>}
            <div style={{background:"rgba(122,158,126,0.06)",border:"1px solid rgba(122,158,126,0.15)",borderRadius:10,padding:"9px 13px",marginBottom:14,fontSize:12,color:"rgba(232,220,200,0.55)"}}>👋 Hey {user.name.split(" ")[0]}! Log your health today.</div>
            <Sec title="Mood">
              <div style={{display:"flex",gap:5}}>
                {MOODS.map((e,i)=>(
                  <button key={i} onClick={()=>setForm(f=>({...f,mood:i}))} style={{flex:1,padding:"8px 0",background:form.mood===i?"rgba(122,158,126,0.2)":"rgba(255,255,255,0.04)",border:form.mood===i?"1px solid rgba(122,158,126,0.5)":"1px solid rgba(255,255,255,0.06)",borderRadius:10,cursor:"pointer",fontSize:16,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                    <span>{e}</span><span style={{fontSize:8,color:form.mood===i?"#7a9e7e":"rgba(232,220,200,0.3)"}}>{MOOD_LABELS[i]}</span>
                  </button>
                ))}
              </div>
            </Sec>
            <Sec title={`Sleep — ${form.sleep}h`}><input type="range" min={0} max={12} step={0.5} value={form.sleep} onChange={e=>setForm(f=>({...f,sleep:parseFloat(e.target.value)}))} style={{width:"100%",accentColor:"#7a9e7e"}} /></Sec>
            <Sec title={`Water — ${form.water} glasses`}><input type="range" min={0} max={15} step={1} value={form.water} onChange={e=>setForm(f=>({...f,water:parseInt(e.target.value)}))} style={{width:"100%",accentColor:"#7a9e7e"}} /></Sec>
            <Sec title={`Exercise — ${form.exercise} min`}><input type="range" min={0} max={120} step={5} value={form.exercise} onChange={e=>setForm(f=>({...f,exercise:parseInt(e.target.value)}))} style={{width:"100%",accentColor:"#7a9e7e"}} /></Sec>
            <Sec title="Symptoms"><input value={form.symptoms} onChange={e=>setForm(f=>({...f,symptoms:e.target.value}))} placeholder="headache, fatigue…" style={inpSt} /></Sec>
            <Sec title="Notes"><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="How are you feeling?" rows={3} style={{...inpSt,resize:"none"}} /></Sec>
            <button onClick={handleLog} disabled={loading} style={primBt(loading)}>{loading?"Analyzing…":"Log & Get AI Insight ✦"}</button>
          </div>
        )}

        {/* ── CALORIES ── */}
        {view==="calories"&&(
          <div>
            <div style={{textAlign:"center",marginBottom:14}}>
              <div style={{fontSize:9,letterSpacing:"0.2em",color:"#7a9e7e",marginBottom:5,textTransform:"uppercase"}}>AI Food Scanner</div>
              <div style={{fontSize:13,color:"rgba(232,220,200,0.5)",lineHeight:1.5}}>Photo upload karo — AI calories & nutrition batayega instantly 🍛</div>
            </div>
            <div onClick={()=>fileRef.current?.click()} style={{border:"2px dashed rgba(122,158,126,0.4)",borderRadius:14,padding:foodImg?0:"24px 20px",textAlign:"center",cursor:"pointer",background:foodImg?"transparent":"rgba(122,158,126,0.04)",marginBottom:10,overflow:"hidden"}}>
              {foodImg?<img src={foodImg} alt="food" style={{width:"100%",maxHeight:210,objectFit:"cover",display:"block"}} />:
                <><div style={{fontSize:40,marginBottom:7}}>📸</div><div style={{fontSize:14,color:"#7a9e7e",marginBottom:3}}>Tap to upload food photo</div><div style={{fontSize:11,color:"rgba(232,220,200,0.3)"}}>Koi bhi khana — dal, pizza, biryani…</div></>}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFoodPick} style={{display:"none"}} />
            </div>
            {foodImg&&(
              <div style={{display:"flex",gap:7,marginBottom:12}}>
                <button onClick={handleScan} disabled={calLoading} style={primBt(calLoading)}>{calLoading?"🔍 Analyzing…":"🔍 Scan Calories"}</button>
                <button onClick={()=>{setFoodImg(null);setFoodB64(null);setCalResult(null);if(fileRef.current)fileRef.current.value="";}} style={ghostBt}>Clear</button>
              </div>
            )}
            {calResult&&!calResult.error&&(
              <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(122,158,126,0.25)",borderRadius:14,padding:14,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div><div style={{fontSize:9,color:"#7a9e7e",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:2}}>Detected</div><div style={{fontSize:16,color:"#f0e6d3"}}>{calResult.dish}</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontSize:26,fontWeight:"700",color:"#c49a6c",lineHeight:1}}>{calResult.calories}</div><div style={{fontSize:9,color:"rgba(232,220,200,0.4)",letterSpacing:"0.1em"}}>CALORIES</div></div>
                </div>
                <div style={{display:"flex",gap:6,marginBottom:10}}>
                  {[{l:"Protein",v:calResult.protein,c:"#7a9e7e"},{l:"Carbs",v:calResult.carbs,c:"#c49a6c"},{l:"Fat",v:calResult.fat,c:"#9e7ab5"}].map(m=>(
                    <div key={m.l} style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:9,padding:"8px 5px",textAlign:"center",border:`1px solid ${m.c}30`}}>
                      <div style={{fontSize:14,fontWeight:"700",color:m.c}}>{m.v}g</div>
                      <div style={{fontSize:9,color:"rgba(232,220,200,0.4)",marginTop:1}}>{m.l}</div>
                    </div>
                  ))}
                </div>
                {calResult.items?.length>0&&<div style={{marginBottom:8}}>{calResult.items.map((item,i)=><div key={i} style={{fontSize:11,color:"rgba(232,220,200,0.55)",padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>• {item}</div>)}</div>}
                {calResult.tip&&<div style={{background:"rgba(122,158,126,0.1)",borderRadius:8,padding:"8px 10px",fontSize:12,color:"#7a9e7e",lineHeight:1.5}}>💡 {calResult.tip}</div>}
              </div>
            )}
            {calResult?.error&&<div style={{...alSt,color:"#e8a0a0",borderColor:"rgba(196,100,100,0.3)"}}>⚠ {calResult.error}</div>}
            {calorieLogs.filter(l=>l.date===todayStr).length>0&&(
              <div>
                <div style={{fontSize:9,color:"rgba(232,220,200,0.3)",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:7}}>Today's Meals</div>
                {calorieLogs.filter(l=>l.date===todayStr).map((log,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 11px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:9,marginBottom:5}}>
                    <div><div style={{fontSize:12,color:"#e8dcc8"}}>{log.dish}</div><div style={{fontSize:10,color:"rgba(232,220,200,0.35)"}}>{log.time}</div></div>
                    <div style={{fontSize:14,fontWeight:"700",color:"#c49a6c"}}>{log.calories} cal</div>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 12px",background:"rgba(196,154,108,0.08)",border:"1px solid rgba(196,154,108,0.2)",borderRadius:9,marginTop:3}}>
                  <span style={{fontSize:13,color:"rgba(232,220,200,0.7)"}}>🔥 Total Today</span>
                  <span style={{fontSize:16,fontWeight:"700",color:"#c49a6c"}}>{todayCals} cal</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ROUTINE ── */}
        {view==="routine"&&(
          <div>
            <div style={{background:"rgba(122,158,126,0.08)",border:"1px solid rgba(122,158,126,0.2)",borderRadius:12,padding:13,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,color:"rgba(232,220,200,0.7)"}}>Today's Progress</span><span style={{fontSize:12,color:"#7a9e7e"}}>{todayDone}/{routine.length}</span></div>
              <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${routine.length?(todayDone/routine.length)*100:0}%`,background:"linear-gradient(90deg,#7a9e7e,#a8c5aa)",borderRadius:3,transition:"width 0.4s"}} /></div>
              {todayDone===routine.length&&routine.length>0&&<div style={{textAlign:"center",marginTop:7,fontSize:12,color:"#7a9e7e"}}>🎉 All done! Great job!</div>}
            </div>
            {[...routine].sort((a,b)=>a.time.localeCompare(b.time)).map(task=>(
              <div key={task.id} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 11px",background:task.done?"rgba(122,158,126,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${task.done?"rgba(122,158,126,0.25)":"rgba(255,255,255,0.07)"}`,borderRadius:11,marginBottom:6,transition:"all 0.2s"}}>
                <button onClick={()=>setRoutine(r=>r.map(t=>t.id===task.id?{...t,done:!t.done}:t))} style={{width:23,height:23,borderRadius:"50%",background:task.done?"#7a9e7e":"rgba(255,255,255,0.07)",border:task.done?"none":"1px solid rgba(255,255,255,0.15)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#0a0f1e",fontWeight:"700",flexShrink:0}}>
                  {task.done?"✓":""}
                </button>
                <span style={{fontSize:15,flexShrink:0}}>{task.icon}</span>
                <div style={{flex:1}}><div style={{fontSize:12,color:task.done?"rgba(232,220,200,0.4)":"#e8dcc8",textDecoration:task.done?"line-through":"none"}}>{task.label}</div><div style={{fontSize:9,color:"rgba(232,220,200,0.3)",marginTop:1}}>{task.time}</div></div>
                <button onClick={()=>setRoutine(r=>r.filter(t=>t.id!==task.id))} style={{background:"none",border:"none",color:"rgba(232,220,200,0.2)",cursor:"pointer",fontSize:17,padding:0}}>×</button>
              </div>
            ))}
            {showAddTask?(
              <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:13,marginTop:6}}>
                <div style={{display:"flex",gap:7,marginBottom:7}}>
                  <input value={newTask.time} onChange={e=>setNewTask(t=>({...t,time:e.target.value}))} type="time" style={{...inpSt,width:100,flex:"none"}} />
                  <input value={newTask.icon} onChange={e=>setNewTask(t=>({...t,icon:e.target.value}))} placeholder="emoji" style={{...inpSt,width:50,flex:"none",textAlign:"center"}} maxLength={2} />
                </div>
                <input value={newTask.label} onChange={e=>setNewTask(t=>({...t,label:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&(newTask.label&&newTask.time)&&(setRoutine(r=>[...r,{id:Date.now(),...newTask,done:false}].sort((a,b)=>a.time.localeCompare(b.time))),setNewTask({time:"",label:"",icon:"⭐"}),setShowAddTask(false))} placeholder="Task name…" style={{...inpSt,marginBottom:9}} />
                <div style={{display:"flex",gap:7}}>
                  <button onClick={()=>{if(newTask.label&&newTask.time){setRoutine(r=>[...r,{id:Date.now(),...newTask,done:false}].sort((a,b)=>a.time.localeCompare(b.time)));setNewTask({time:"",label:"",icon:"⭐"});setShowAddTask(false);}}} style={primBt(false)}>Add</button>
                  <button onClick={()=>setShowAddTask(false)} style={ghostBt}>Cancel</button>
                </div>
              </div>
            ):(
              <div style={{display:"flex",gap:7,marginTop:7}}>
                <button onClick={()=>setShowAddTask(true)} style={{flex:1,padding:"10px",background:"rgba(122,158,126,0.08)",border:"1px dashed rgba(122,158,126,0.3)",borderRadius:9,color:"#7a9e7e",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>+ Add Task</button>
                <button onClick={()=>setRoutine(r=>r.map(t=>({...t,done:false})))} style={ghostBt}>Reset</button>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY ── */}
        {view==="history"&&(
          <div>
            {logs.length===0?<div style={{textAlign:"center",padding:36,color:"rgba(232,220,200,0.3)",fontSize:13}}>No entries yet. Log your first day!</div>:(
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:14}}>
                  {[{icon:"😊",label:"Avg Mood",value:avg("mood")==="—"?"—":MOOD_LABELS[Math.round(parseFloat(avg("mood")))]},{icon:"🌙",label:"Avg Sleep",value:`${avg("sleep")}h`},{icon:"💧",label:"Avg Water",value:`${avg("water")}gl`},{icon:"🏃",label:"Avg Exercise",value:`${avg("exercise")}m`}].map(s=>(
                    <div key={s.label} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:11,padding:11,textAlign:"center"}}>
                      <div style={{fontSize:18,marginBottom:3}}>{s.icon}</div>
                      <div style={{fontSize:14,fontWeight:"700",color:"#e8dcc8"}}>{s.value}</div>
                      <div style={{fontSize:9,color:"rgba(232,220,200,0.4)",marginTop:1}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {logs.map((log,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:11,padding:"10px 12px",marginBottom:7}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:11,color:"rgba(232,220,200,0.5)"}}>{log.date}</span><span style={{fontSize:15}}>{MOODS[log.mood]}</span></div>
                    <div style={{display:"flex",gap:9,flexWrap:"wrap",fontSize:11,color:"rgba(232,220,200,0.55)"}}><span>🌙{log.sleep}h</span><span>💧{log.water}gl</span><span>🏃{log.exercise}m</span>{log.symptoms&&<span style={{color:"#c49a6c"}}>⚠{log.symptoms}</span>}</div>
                    {log.notes&&<div style={{marginTop:4,fontSize:11,color:"rgba(232,220,200,0.4)",fontStyle:"italic"}}>"{log.notes}"</div>}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── AI CHAT ── */}
        {view==="chat"&&(
          <div>
            {aiChat.length===0&&(
              <div>
                <div style={{textAlign:"center",padding:"24px 20px",color:"rgba(232,220,200,0.3)",fontSize:13}}>Log your health data and get AI insights, or ask a question below.</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                  {["How can I sleep better?","What should I eat today?","Tips for more energy","How much water do I need?"].map(q=>(
                    <button key={q} onClick={()=>setAiInput(q)} style={{padding:"6px 10px",background:"rgba(122,158,126,0.1)",border:"1px solid rgba(122,158,126,0.2)",borderRadius:20,color:"rgba(232,220,200,0.6)",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            <div style={{marginBottom:14}}>
              {aiChat.map((msg,i)=>(
                <div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",marginBottom:9}}>
                  <div style={{maxWidth:"85%",padding:"10px 12px",borderRadius:msg.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",background:msg.role==="user"?"rgba(122,158,126,0.25)":"rgba(255,255,255,0.05)",border:`1px solid ${msg.role==="user"?"rgba(122,158,126,0.3)":"rgba(255,255,255,0.08)"}`,fontSize:13,lineHeight:1.6,color:"#e8dcc8"}}>
                    {msg.auto&&<div style={{fontSize:9,color:"#7a9e7e",marginBottom:4,letterSpacing:"0.1em",textTransform:"uppercase"}}>AI Insight</div>}
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading&&<div style={{display:"flex",justifyContent:"flex-start",marginBottom:9}}><div style={{padding:"10px 12px",borderRadius:"18px 18px 18px 4px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",fontSize:13,color:"rgba(232,220,200,0.4)"}}>Thinking…</div></div>}
              <div ref={chatEndRef} />
            </div>
            <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"9px 12px",background:"rgba(10,15,30,0.97)",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",gap:6}}>
              <input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&handleChat()} placeholder="Ask your AI health coach…" style={{...inpSt,flex:1}} disabled={loading} />
              <button onClick={handleChat} disabled={loading||!aiInput.trim()} style={{padding:"9px 13px",background:(!loading&&aiInput.trim())?"rgba(122,158,126,0.85)":"rgba(122,158,126,0.3)",border:"none",borderRadius:9,color:"#0a0f1e",fontSize:13,fontWeight:"700",cursor:(!loading&&aiInput.trim())?"pointer":"not-allowed",fontFamily:"inherit"}}>Send</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function Sec({title,children}) {
  return <div style={{marginBottom:13}}><div style={{fontSize:9,letterSpacing:"0.15em",color:"rgba(232,220,200,0.4)",textTransform:"uppercase",marginBottom:6}}>{title}</div>{children}</div>;
}

const inpSt = {width:"100%",padding:"8px 11px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,color:"#e8dcc8",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
const labelSt = {fontSize:9,letterSpacing:"0.12em",color:"rgba(232,220,200,0.4)",textTransform:"uppercase",marginBottom:5};
const alSt = {background:"rgba(122,158,126,0.1)",border:"1px solid rgba(122,158,126,0.25)",borderRadius:9,padding:"7px 12px",marginBottom:13,fontSize:12,color:"#7a9e7e"};
const primBt = d => ({flex:1,width:"100%",padding:"11px",background:d?"rgba(122,158,126,0.3)":"rgba(122,158,126,0.85)",border:"none",borderRadius:9,color:"#0a0f1e",fontSize:13,fontWeight:"700",cursor:d?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.2s"});
const ghostBt = {flex:1,padding:"11px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,color:"rgba(232,220,200,0.45)",fontSize:13,cursor:"pointer",fontFamily:"inherit"};
