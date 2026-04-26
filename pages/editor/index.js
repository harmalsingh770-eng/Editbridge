import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function Editor() {
  const router = useRouter();

  const [user,setUser] = useState(null);
  const [editor,setEditor] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async(u)=>{
      if(!u){
        router.push("/editor-login");
        return;
      }

      setUser(u);

      const snap = await getDoc(doc(db,"editors",u.uid));

      if(!snap.exists()){
        router.push("/editor-login");
        return;
      }

      setEditor(snap.data());
    });

    return ()=>unsub();
  },[]);

  const logout = async()=>{
    await signOut(auth);
    router.push("/");
  };

  if(!editor) return <p style={{padding:30}}>Loading...</p>;

  return (
    <div style={page}>
      <h1>🎬 Editor Dashboard</h1>

      <div style={card}>
        <h2>{editor.name}</h2>
        <p>{user.email}</p>
        <p>Skills: {editor.skills?.join(", ")}</p>
        <p>Price: ₹{editor.price}</p>
        <p>Status: {editor.active ? "🟢 Online" : "🔴 Offline"}</p>
      </div>

      <div style={{display:"grid",gap:"14px",marginTop:"25px"}}>

        <button style={btnPurple}
          onClick={()=>router.push("/editor/inbox")}>
          📩 Inbox
        </button>

        <button style={btnBlue}
          onClick={()=>router.push("/profile")}>
          ⚙️ Settings
        </button>

        <button style={btnGreen}
          onClick={()=>router.push(`/chat/admin_${user.uid}`)}>
          💬 Chat Admin
        </button>

        <button style={btnRed}
          onClick={logout}>
          Logout
        </button>

      </div>
    </div>
  );
}

const page={
minHeight:"100vh",
padding:"40px",
background:"linear-gradient(135deg,#0f172a,#1e1b4b,#581c87)",
color:"white"
};

const card={
padding:"25px",
borderRadius:"18px",
background:"rgba(255,255,255,0.08)",
marginTop:"25px"
};

const btnPurple=btn("#8b5cf6");
const btnBlue=btn("#06b6d4");
const btnGreen=btn("#10b981");
const btnRed=btn("#ef4444");

function btn(bg){
return{
padding:"14px",
border:"none",
borderRadius:"12px",
background:bg,
color:"white",
fontWeight:"bold",
cursor:"pointer"
};
}