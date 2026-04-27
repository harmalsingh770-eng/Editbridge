import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Inbox(){
  const [chats,setChats]=useState([]);
  const router=useRouter();

  useEffect(()=>{
    const q=query(collection(db,"chats"),
      where("editorId","==",auth.currentUser.uid)
    );

    return onSnapshot(q,(snap)=>{
      setChats(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
  },[]);

  return(
    <div style={{color:"white"}}>
      {chats.map(c=>(
        <div key={c.id} onClick={()=>router.push(`/chat/${c.id}`)}>
          Open Chat
        </div>
      ))}
    </div>
  );
}