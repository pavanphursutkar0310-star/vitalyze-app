import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform, FlatList, StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Constants ─────────────────────────────────────────
const BACKEND = "https://vitalyze-backend-uylp.onrender.com";
const MOODS = ["😞","😕","😐","🙂","😄"];
const MOOD_LABELS = ["Rough","Low","Okay","Good","Great"];
const DEFAULT_ROUTINE = [
  { id:1, time:"06:30", label:"Wake up & Stretch", icon:"🌅", done:false },
  { id:2, time:"07:00", label:"Morning Walk / Run", icon:"🏃", done:false },
  { id:3, time:"08:00", label:"Healthy Breakfast", icon:"🥗", done:false },
  { id:4, time:"12:30", label:"Drink 2 glasses water", icon:"💧", done:false },
  { id:5, time:"13:00", label:"Lunch", icon:"🍱", done:false },
  { id:6, time:"17:00", label:"Evening Exercise", icon:"💪", done:false },
  { id:7, time:"19:30", label:"Dinner", icon:"🍽️", done:false },
  { id:8, time:"22:00", label:"Wind down", icon:"🌙", done:false },
  { id:9, time:"22:30", label:"Sleep", icon:"😴", done:false },
];

// ─── Colors ────────────────────────────────────────────
const C = {
  bg: "#0a0f1e",
  bg2: "#0d1b2a",
  green: "#7a9e7e",
  gold: "#c49a6c",
  text: "#e8dcc8",
  textDim: "rgba(232,220,200,0.4)",
  border: "rgba(255,255,255,0.08)",
  card: "rgba(255,255,255,0.04)",
};

// ─── Storage ───────────────────────────────────────────
const sGet = async (key, def) => {
  try { const v = await AsyncStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
};
const sSet = async (key, val) => {
  try { await AsyncStorage.setItem(key, JSON.stringify(val)); } catch {}
};

// ─── API ───────────────────────────────────────────────
async function callAI(messages, system) {
  try {
    const res = await fetch(`${BACKEND}/claude`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, system }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || "Sorry, could not respond.";
  } catch {
    return "Backend se connect nahi ho paya.";
  }
}

// ═══════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sGet("vz_session", null).then(u => { setUser(u); setLoading(false); });
  }, []);

  const login = async (u) => { await sSet("vz_session", u); setUser(u); };
  const logout = async () => { await AsyncStorage.removeItem("vz_session"); setUser(null); };

  if (loading) return (
    <View style={[s.center, { backgroundColor: C.bg, flex: 1 }]}>
      <Text style={{ fontSize: 40 }}>💚</Text>
      <Text style={[s.title, { marginTop: 10 }]}>Vitalyze AI</Text>
    </View>
  );

  if (!user) return <AuthScreen onLogin={login} />;
  return <MainApp user={user} onLogout={logout} />;
}

// ═══════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr("");
    if (!email.trim() || !pass.trim()) { setErr("Email aur password daalo"); return; }
    if (pass.length < 6) { setErr("Password kam se kam 6 characters ka hona chahiye"); return; }
    if (mode === "signup" && !name.trim()) { setErr("Naam daalo"); return; }
    setLoading(true);
    const users = await sGet("vz_users", {});
    const key = email.toLowerCase().trim();
    if (mode === "signup") {
      if (users[key]) { setErr("Account already exists"); setLoading(false); return; }
      users[key] = { name: name.trim(), email: key, pass };
      await sSet("vz_users", users);
      onLogin({ name: name.trim(), email: key });
    } else {
      if (!users[key]) { setErr("Account nahi mila"); setLoading(false); return; }
      if (users[key].pass !== pass) { setErr("Password galat hai"); setLoading(false); return; }
      onLogin({ name: users[key].name, email: key });
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor: C.bg }} behavior={Platform.OS==="ios"?"padding":"height"}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={[s.center, { padding: 24, flexGrow:1 }]}>
        <Text style={{ fontSize: 50, marginBottom: 8 }}>💚</Text>
        <Text style={[s.title, { fontSize: 26, marginBottom: 4 }]}>Vitalyze AI</Text>
        <Text style={[s.dim, { fontSize: 11, letterSpacing: 2, marginBottom: 32 }]}>YOUR PERSONAL HEALTH INTELLIGENCE</Text>

        {/* Toggle */}
        <View style={[s.row, { backgroundColor:"rgba(0,0,0,0.3)", borderRadius:10, padding:3, marginBottom:20, width:"100%" }]}>
          {["login","signup"].map(m => (
            <TouchableOpacity key={m} onPress={()=>{setMode(m);setErr("");}} style={[{ flex:1, padding:10, borderRadius:8, alignItems:"center" }, mode===m && { backgroundColor:"rgba(122,158,126,0.4)" }]}>
              <Text style={{ color: mode===m ? C.text : C.textDim, fontSize:13 }}>{m==="login"?"Sign In":"Sign Up"}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode==="signup" && <TextInput style={s.input} placeholder="Full Name" placeholderTextColor={C.textDim} value={name} onChangeText={setName} />}
        <TextInput style={s.input} placeholder="Email" placeholderTextColor={C.textDim} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={s.input} placeholder="Password" placeholderTextColor={C.textDim} value={pass} onChangeText={setPass} secureTextEntry />

        {!!err && <Text style={{ color:"#e8a0a0", marginBottom:12, fontSize:12 }}>{err}</Text>}

        <TouchableOpacity style={[s.btn, { width:"100%" }]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color={C.bg} /> : <Text style={s.btnText}>{mode==="login"?"Sign In →":"Create Account →"}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════
function MainApp({ user, onLogout }) {
  const [tab, setTab] = useState("log");
  const TABS = [
    {id:"log", icon:"📋", label:"Log"},
    {id:"routine", icon:"📅", label:"Routine"},
    {id:"history", icon:"📊", label:"History"},
    {id:"chat", icon:"🤖", label:"AI Coach"},
  ];

  return (
    <View style={{ flex:1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      {/* Header */}
      <View style={[s.row, { padding:16, paddingTop:50, borderBottomWidth:1, borderBottomColor:C.border, justifyContent:"space-between" }]}>
        <View>
          <Text style={[s.dim, { fontSize:9, letterSpacing:2 }]}>HEALTH INTELLIGENCE</Text>
          <Text style={[s.title, { fontSize:20 }]}>Vitalyze <Text style={{ color:C.green }}>✦</Text> AI</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={{ width:36, height:36, borderRadius:18, backgroundColor:"rgba(122,158,126,0.2)", alignItems:"center", justifyContent:"center", borderWidth:1, borderColor:"rgba(122,158,126,0.35)" }}>
          <Text style={{ color:C.green, fontSize:15, fontWeight:"bold" }}>{user.name[0].toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{ flex:1 }}>
        {tab==="log" && <LogTab user={user} />}
        {tab==="routine" && <RoutineTab user={user} />}
        {tab==="history" && <HistoryTab user={user} />}
        {tab==="chat" && <ChatTab user={user} />}
      </View>

      {/* Bottom Nav */}
      <View style={[s.row, { borderTopWidth:1, borderTopColor:C.border, backgroundColor:C.bg2, paddingBottom:20 }]}>
        {TABS.map(t => (
          <TouchableOpacity key={t.id} onPress={()=>setTab(t.id)} style={{ flex:1, alignItems:"center", paddingTop:10 }}>
            <Text style={{ fontSize:18 }}>{t.icon}</Text>
            <Text style={{ fontSize:9, color: tab===t.id ? C.text : C.textDim, marginTop:2 }}>{t.label}</Text>
            {tab===t.id && <View style={{ width:20, height:2, backgroundColor:C.green, borderRadius:1, marginTop:3 }} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════
// LOG TAB
// ═══════════════════════════════════════════════════════
function LogTab({ user }) {
  const [mood, setMood] = useState(2);
  const [sleep, setSleep] = useState(7);
  const [water, setWater] = useState(6);
  const [exercise, setExercise] = useState(0);
  const [notes, setNotes] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitLog() {
    setLoading(true);
    const entry = { mood, sleep, water, exercise, notes, symptoms, date: new Date().toDateString(), timestamp: Date.now() };
    const logs = await sGet(`vz_${user.email}_logs`, []);
    const newLogs = [entry, ...logs.filter(l => l.date !== entry.date)];
    await sSet(`vz_${user.email}_logs`, newLogs);

    const summary = newLogs.slice(0,5).map(l =>
      `${l.date}: mood ${MOOD_LABELS[l.mood]}, sleep ${l.sleep}h, water ${l.water} glasses, exercise ${l.exercise}min`
    ).join("\n");

    const reply = await callAI([{ role:"user", content:`My health log:\n${summary}\n\nGive me a brief insight.` }],
      "You are an empathetic AI health coach. Give personalized insights in 2-3 sentences. Be warm and actionable.");

    setLoading(false);
    Alert.alert("💚 AI Insight", reply);
    setNotes(""); setSymptoms("");
  }

  return (
    <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16 }}>
      <Text style={[s.greeting, { marginBottom:16 }]}>Hey {user.name.split(" ")[0]}! How are you feeling? 👋</Text>

      <Card title="Mood">
        <View style={s.row}>
          {MOODS.map((emoji,i) => (
            <TouchableOpacity key={i} onPress={()=>setMood(i)} style={[s.moodBtn, mood===i && s.moodBtnActive]}>
              <Text style={{ fontSize:22 }}>{emoji}</Text>
              <Text style={[s.dim, { fontSize:8, marginTop:2 }]}>{MOOD_LABELS[i]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card title={`Sleep — ${sleep}h`}>
        <View style={s.row}>
          {[4,5,6,7,8,9,10].map(h => (
            <TouchableOpacity key={h} onPress={()=>setSleep(h)} style={[s.numBtn, sleep===h && s.numBtnActive]}>
              <Text style={{ color: sleep===h ? C.bg : C.text, fontSize:13 }}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card title={`Water — ${water} glasses`}>
        <View style={s.row}>
          {[2,4,6,8,10,12].map(w => (
            <TouchableOpacity key={w} onPress={()=>setWater(w)} style={[s.numBtn, water===w && s.numBtnActive]}>
              <Text style={{ color: water===w ? C.bg : C.text, fontSize:13 }}>{w}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card title={`Exercise — ${exercise} min`}>
        <View style={s.row}>
          {[0,15,30,45,60,90].map(e => (
            <TouchableOpacity key={e} onPress={()=>setExercise(e)} style={[s.numBtn, exercise===e && s.numBtnActive]}>
              <Text style={{ color: exercise===e ? C.bg : C.text, fontSize:11 }}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card title="Symptoms (optional)">
        <TextInput style={s.input} placeholder="headache, fatigue..." placeholderTextColor={C.textDim} value={symptoms} onChangeText={setSymptoms} />
      </Card>

      <Card title="Notes (optional)">
        <TextInput style={[s.input, { height:80, textAlignVertical:"top" }]} placeholder="How are you feeling overall?" placeholderTextColor={C.textDim} value={notes} onChangeText={setNotes} multiline />
      </Card>

      <TouchableOpacity style={[s.btn, { marginBottom:40 }]} onPress={submitLog} disabled={loading}>
        {loading ? <ActivityIndicator color={C.bg} /> : <Text style={s.btnText}>Log & Get AI Insight ✦</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════
// ROUTINE TAB
// ═══════════════════════════════════════════════════════
function RoutineTab({ user }) {
  const [routine, setRoutine] = useState([]);

  useEffect(() => {
    sGet(`vz_${user.email}_routine`, DEFAULT_ROUTINE).then(setRoutine);
  }, []);

  const toggle = async (id) => {
    const updated = routine.map(t => t.id===id ? {...t, done:!t.done} : t);
    setRoutine(updated);
    await sSet(`vz_${user.email}_routine`, updated);
  };

  const reset = async () => {
    const updated = routine.map(t => ({...t, done:false}));
    setRoutine(updated);
    await sSet(`vz_${user.email}_routine`, updated);
  };

  const done = routine.filter(t=>t.done).length;
  const progress = routine.length ? done/routine.length : 0;

  return (
    <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16 }}>
      <View style={[s.card, { marginBottom:14 }]}>
        <View style={[s.row, { justifyContent:"space-between", marginBottom:8 }]}>
          <Text style={s.cardTitle}>Today's Progress</Text>
          <Text style={{ color:C.green, fontSize:13 }}>{done}/{routine.length} done</Text>
        </View>
        <View style={{ height:6, backgroundColor:"rgba(255,255,255,0.08)", borderRadius:3 }}>
          <View style={{ height:6, width:`${progress*100}%`, backgroundColor:C.green, borderRadius:3 }} />
        </View>
        {done===routine.length && routine.length>0 && <Text style={{ color:C.green, textAlign:"center", marginTop:8, fontSize:12 }}>🎉 All done! Great job!</Text>}
      </View>

      {routine.map(task => (
        <TouchableOpacity key={task.id} onPress={()=>toggle(task.id)} style={[s.card, s.row, { marginBottom:8, backgroundColor: task.done?"rgba(122,158,126,0.08)":C.card }]}>
          <View style={[s.checkbox, task.done && s.checkboxDone]}>
            {task.done && <Text style={{ color:C.bg, fontSize:10, fontWeight:"bold" }}>✓</Text>}
          </View>
          <Text style={{ fontSize:20, marginHorizontal:10 }}>{task.icon}</Text>
          <View style={{ flex:1 }}>
            <Text style={[{ color: task.done ? C.textDim : C.text, fontSize:13 }, task.done && { textDecorationLine:"line-through" }]}>{task.label}</Text>
            <Text style={[s.dim, { fontSize:10, marginTop:2 }]}>{task.time}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={[s.btn, { backgroundColor:"rgba(255,255,255,0.05)", marginBottom:40 }]} onPress={reset}>
        <Text style={[s.btnText, { color:C.textDim }]}>Reset All</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════
// HISTORY TAB
// ═══════════════════════════════════════════════════════
function HistoryTab({ user }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    sGet(`vz_${user.email}_logs`, []).then(setLogs);
  }, []);

  const avg = (key) => logs.length ? (logs.reduce((s,l)=>s+(l[key]||0),0)/logs.length).toFixed(1) : "—";

  if (logs.length===0) return (
    <View style={[s.center, { flex:1 }]}>
      <Text style={s.dim}>No entries yet. Log your first day! 📋</Text>
    </View>
  );

  return (
    <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16 }}>
      <View style={[s.row, { flexWrap:"wrap", gap:8, marginBottom:14 }]}>
        {[
          {label:"Avg Mood", value:avg("mood")==="—"?"—":MOOD_LABELS[Math.round(parseFloat(avg("mood")))], icon:"😊"},
          {label:"Avg Sleep", value:`${avg("sleep")}h`, icon:"🌙"},
          {label:"Avg Water", value:`${avg("water")} gl`, icon:"💧"},
          {label:"Avg Exercise", value:`${avg("exercise")}m`, icon:"🏃"},
        ].map(stat => (
          <View key={stat.label} style={[s.card, { width:"47%", alignItems:"center" }]}>
            <Text style={{ fontSize:20, marginBottom:4 }}>{stat.icon}</Text>
            <Text style={[s.title, { fontSize:15 }]}>{stat.value}</Text>
            <Text style={[s.dim, { fontSize:9, marginTop:2 }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {logs.map((log,i) => (
        <View key={i} style={[s.card, { marginBottom:8 }]}>
          <View style={[s.row, { justifyContent:"space-between", marginBottom:6 }]}>
            <Text style={[s.dim, { fontSize:11 }]}>{log.date}</Text>
            <Text style={{ fontSize:18 }}>{MOODS[log.mood]}</Text>
          </View>
          <View style={[s.row, { flexWrap:"wrap", gap:10 }]}>
            <Text style={[s.dim, { fontSize:11 }]}>🌙 {log.sleep}h</Text>
            <Text style={[s.dim, { fontSize:11 }]}>💧 {log.water} gl</Text>
            <Text style={[s.dim, { fontSize:11 }]}>🏃 {log.exercise}m</Text>
            {!!log.symptoms && <Text style={{ fontSize:11, color:C.gold }}>⚠ {log.symptoms}</Text>}
          </View>
          {!!log.notes && <Text style={[s.dim, { fontSize:11, marginTop:6, fontStyle:"italic" }]}>"{log.notes}"</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════
// CHAT TAB
// ═══════════════════════════════════════════════════════
function ChatTab({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  async function send() {
    if (!input.trim()) return;
    const userMsg = { role:"user", content:input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    const logs = await sGet(`vz_${user.email}_logs`, []);
    const ctx = logs.length ? `User health data:\n${logs.slice(0,5).map(l=>`${l.date}: mood ${MOOD_LABELS[l.mood]}, sleep ${l.sleep}h, water ${l.water}gl, exercise ${l.exercise}min`).join("\n")}\n\n` : "";

    const apiMsgs = newMsgs.map((m,i) => i===newMsgs.length-1 ? {...m, content:ctx+m.content} : m);
    const reply = await callAI(apiMsgs, "You are an empathetic AI health coach named Vitalyze. Give personalized, warm, actionable advice in 2-4 sentences.");
    setLoading(false);
    setMessages([...newMsgs, { role:"assistant", content:reply }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated:true }), 100);
  }

  const QUICK = ["Sleep tips?","More energy?","Healthy diet?","Stress relief?"];

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==="ios"?"padding":"height"} keyboardVerticalOffset={100}>
      <ScrollView ref={scrollRef} style={{ flex:1 }} contentContainerStyle={{ padding:16 }}>
        {messages.length===0 && (
          <>
            <View style={[s.card, { marginBottom:12 }]}>
              <Text style={[s.dim, { textAlign:"center", lineHeight:20 }]}>Log your health data and get AI insights, or ask any health question! 💚</Text>
            </View>
            <View style={[s.row, { flexWrap:"wrap", gap:8, marginBottom:12 }]}>
              {QUICK.map(q => (
                <TouchableOpacity key={q} onPress={()=>setInput(q)} style={{ paddingHorizontal:12, paddingVertical:7, backgroundColor:"rgba(122,158,126,0.1)", borderRadius:20, borderWidth:1, borderColor:"rgba(122,158,126,0.2)" }}>
                  <Text style={{ color:C.textDim, fontSize:11 }}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {messages.map((msg,i) => (
          <View key={i} style={{ alignItems: msg.role==="user" ? "flex-end" : "flex-start", marginBottom:10 }}>
            <View style={[s.bubble, msg.role==="user" ? s.bubbleUser : s.bubbleAI]}>
              <Text style={{ color:C.text, fontSize:13, lineHeight:20 }}>{msg.content}</Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={[s.bubbleAI, { alignSelf:"flex-start", marginBottom:10 }]}>
            <ActivityIndicator size="small" color={C.green} />
          </View>
        )}
      </ScrollView>

      <View style={[s.row, { padding:12, borderTopWidth:1, borderTopColor:C.border, backgroundColor:C.bg2 }]}>
        <TextInput
          style={[s.input, { flex:1, marginBottom:0, marginRight:8 }]}
          placeholder="Ask your AI health coach..."
          placeholderTextColor={C.textDim}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
        />
        <TouchableOpacity onPress={send} disabled={loading||!input.trim()} style={[s.btn, { paddingHorizontal:16, paddingVertical:12, marginBottom:0, opacity:(!loading&&input.trim())?1:0.4 }]}>
          <Text style={s.btnText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Reusable Components ────────────────────────────────
function Card({ title, children }) {
  return (
    <View style={[s.card, { marginBottom:12 }]}>
      {title && <Text style={s.cardTitle}>{title}</Text>}
      {children}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────
const s = StyleSheet.create({
  center: { alignItems:"center", justifyContent:"center" },
  row: { flexDirection:"row", alignItems:"center" },
  title: { color: C.text, fontWeight:"600", fontSize:16 },
  dim: { color: C.textDim, fontSize:12 },
  greeting: { color: C.text, fontSize:14 },
  card: { backgroundColor:C.card, borderWidth:1, borderColor:C.border, borderRadius:12, padding:14 },
  cardTitle: { color:C.textDim, fontSize:9, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 },
  input: { backgroundColor:"rgba(255,255,255,0.05)", borderWidth:1, borderColor:"rgba(255,255,255,0.1)", borderRadius:10, padding:10, color:C.text, fontSize:13, marginBottom:0, width:"100%" },
  btn: { backgroundColor:"rgba(122,158,126,0.85)", borderRadius:10, padding:14, alignItems:"center" },
  btnText: { color:"#0a0f1e", fontWeight:"bold", fontSize:14 },
  moodBtn: { flex:1, alignItems:"center", padding:8, borderRadius:10, backgroundColor:"rgba(255,255,255,0.04)", borderWidth:1, borderColor:C.border, marginHorizontal:2 },
  moodBtnActive: { backgroundColor:"rgba(122,158,126,0.2)", borderColor:"rgba(122,158,126,0.5)" },
  numBtn: { flex:1, alignItems:"center", padding:8, borderRadius:8, backgroundColor:"rgba(255,255,255,0.04)", borderWidth:1, borderColor:C.border, marginHorizontal:2 },
  numBtnActive: { backgroundColor:C.green, borderColor:C.green },
  checkbox: { width:24, height:24, borderRadius:12, borderWidth:1, borderColor:C.border, alignItems:"center", justifyContent:"center" },
  checkboxDone: { backgroundColor:C.green, borderColor:C.green },
  bubble: { maxWidth:"85%", padding:12, borderRadius:16 },
  bubbleUser: { backgroundColor:"rgba(122,158,126,0.25)", borderWidth:1, borderColor:"rgba(122,158,126,0.3)", borderBottomRightRadius:4 },
  bubbleAI: { backgroundColor:C.card, borderWidth:1, borderColor:C.border, borderBottomLeftRadius:4 },
});
