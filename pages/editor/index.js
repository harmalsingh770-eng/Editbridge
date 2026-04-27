import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Editor() {
  const [editor,setEditor]=useState(null);
  const router=useRouter();

  useEffect(()=>{
    onAuthStateChanged(auth, async(u)=>{
      if(!u) return router.push("/login?type=editor");

      const snap=await getDoc(doc(db,"editors",u.uid));
      if(!snap.exists()) return router.push("/");

      setEditor({id:u.uid,...snap.data()});
    });
  },[]);

  const save=async()=>{
    await updateDoc(doc(db,"editors",editor.id),editor);
    alert("saved");
  };

  if(!editor) return <div>Loading...</div>;

  return (
    <div style={{color:"white",padding:20}}>
      <h1>Editor Panel</h1>

      <input value={editor.name} onChange={e=>setEditor({...editor,name:e.target.value})}/>
      <input value={editor.price} onChange={e=>setEditor({...editor,price:e.target.value})}/>

      <button onClick={save}>Save</button>

      <button onClick={()=>router.push("/editor/inbox")}>Inbox</button>

      <button onClick={()=>signOut(auth)}>Logout</button>
    </div>
  );
}