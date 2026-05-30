"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function translateError(msg:string):string{
  const m:Record<string,string>={
    "Invalid login credentials":"邮箱或密码错误，请检查后重试",
    "Invalid email or password":"邮箱或密码错误",
    "Invalid Refresh Token":"登录已过期，请重新登录",
    "Email not confirmed":"邮箱尚未验证，请先点击邮件中的确认链接",
    "User not found":"该邮箱尚未注册",
    "User already registered":"该邮箱已注册，请直接登录",
    "Signups not allowed":"新用户注册功能暂未开放，请联系管理员",
    "For security purposes":"发送过于频繁，请 60 秒后再试",
    "Email rate limit exceeded":"邮件发送频率超限，请稍后再试",
    "Token has expired":"验证码已过期，请重新获取",
    "Invalid OTP":"验证码错误，请检查后重新输入",
    "Password must be":"密码长度不能少于 6 位",
    "Auth session missing":"登录已过期，请重新登录",
  };
  for(const[k,v]of Object.entries(m)){if(msg.includes(k))return v;}
  return "操作失败："+msg;
}

type Step="emailInput"|"otpInput"|"passwordLogin";

export default function AuthPage(){
  const router=useRouter();
  const supabase=createClient();
  const[step,setStep]=useState<Step>("emailInput");
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[code,setCode]=useState("");
  const[error,setError]=useState("");
  const[message,setMessage]=useState("");
  const[loading,setLoading]=useState(false);
  const[countdown,setCountdown]=useState(0);

  const startCD=()=>{setCountdown(60);const t=setInterval(()=>{setCountdown(c=>{if(c<=1){clearInterval(t);return 0}return c-1})},1000)};

  async function sendOtp(e:React.FormEvent){
    e.preventDefault();setError("");if(!email.trim()){setError("请输入邮箱地址");return}
    setLoading(true);
    const{error:otpErr}=await supabase.auth.signInWithOtp({email:email.trim(),options:{shouldCreateUser:true}});
    if(otpErr){setError(translateError(otpErr.message));setLoading(false);return}
    setMessage("验证码已发送至 "+email.trim()+"，如未收到请查看垃圾邮件或稍等片刻");
    setStep("otpInput");startCD();setLoading(false);
  }

  async function doVerify(token:string){
    if(token.length!==6){setError("请输入完整的6位验证码");return}
    setError("");setLoading(true);
    const{error:vErr}=await supabase.auth.verifyOtp({email:email.trim(),token,type:"email"});
    if(vErr){setError(translateError(vErr.message));setLoading(false);return}
    const{data:{user}}=await supabase.auth.getUser();
    if(user){const{data:p}=await supabase.from("profiles").select("id").eq("id",user.id).single();if(!p)await supabase.from("profiles").insert({id:user.id,role:"customer"})}
    router.push("/");router.refresh();
  }

  async function passwordLogin(e:React.FormEvent){
    e.preventDefault();setError("");if(!password){setError("请输入密码");return}
    setLoading(true);
    const{error:sErr}=await supabase.auth.signInWithPassword({email:email.trim(),password});
    if(sErr){setError(translateError(sErr.message));setLoading(false);return}
    router.push("/");router.refresh();
  }

  function handleCodeInput(v:string){
    const digits=v.replace(/\D/g,"").slice(0,6);
    setCode(digits);
    // 直接传值，避免 setTimeout 闭包捕获旧 state
    if(digits.length===6)setTimeout(()=>doVerify(digits),200);
  }

  async function resendOtp(){
    if(countdown>0)return;setError("");setLoading(true);
    const{error:oErr}=await supabase.auth.signInWithOtp({email:email.trim(),options:{shouldCreateUser:true}});
    if(oErr){setError(translateError(oErr.message));setLoading(false);return}
    setMessage("验证码已重新发送");startCD();setLoading(false);
  }

  const goBack=()=>{setStep("emailInput");setError("");setMessage("");setCode("")};

  return(<div className="flex min-h-[80vh] items-center justify-center px-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <h1 className="mb-2 text-center text-2xl font-bold text-emerald-700">顺瑞益宠</h1>
      <p className="mb-6 text-center text-sm text-gray-400">登录或注册账号</p>
      {message&&(<div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>)}
      {error&&(<div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>)}
      {step==="emailInput"&&(<form onSubmit={sendOtp} className="space-y-4">
        <div><label className="mb-1 block text-sm font-medium text-gray-700">邮箱地址</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="your@email.com" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" /></div>
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">{loading?"发送中...":"发送验证码"}</button>
        <button type="button" onClick={()=>{setStep("passwordLogin");setError("")}} className="w-full text-center text-sm text-gray-500 hover:underline">使用密码登录</button>
      </form>)}
      {step==="otpInput"&&(<div className="space-y-4">
        <p className="text-sm text-gray-600">请输入发送到 <strong>{email}</strong> 的 6 位验证码</p>
        <div className="relative mx-auto w-fit">
          <input type="text" inputMode="numeric" maxLength={6} value={code}
            onChange={e=>handleCodeInput(e.target.value)}
            autoFocus autoComplete="one-time-code"
            className="absolute inset-0 h-full w-full bg-transparent text-transparent caret-emerald-600 tracking-[2.2em] pl-[0.6em] text-2xl font-mono outline-none"
            style={{letterSpacing:"2.2em",paddingLeft:"0.6em"}} />
          <div className="flex gap-2">
            {[0,1,2,3,4,5].map(i=>(
              <div key={i} className={"h-12 w-12 rounded-lg border-2 flex items-center justify-center text-xl font-bold "+(code[i]?"border-emerald-500 bg-emerald-50 text-emerald-700":"border-gray-300 text-gray-400")}>
                {code[i]||""}
              </div>
            ))}
          </div>
        </div>
        <button onClick={()=>doVerify(code)} disabled={loading} className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">{loading?"验证中...":"确认登录"}</button>
        <div className="flex items-center justify-between text-sm">
          <button onClick={resendOtp} disabled={countdown>0} className="text-emerald-600 hover:underline disabled:text-gray-400">{countdown>0?countdown+" 秒后重发":"重新发送验证码"}</button>
          <button onClick={()=>{setStep("passwordLogin");setError("")}} className="text-gray-500 hover:underline">使用密码登录</button>
        </div>
        <button onClick={goBack} className="w-full text-center text-sm text-gray-400 hover:underline">← 更换邮箱</button>
      </div>)}
      {step==="passwordLogin"&&(<form onSubmit={passwordLogin} className="space-y-4">
        <p className="text-sm text-gray-600">使用密码登录 <strong>{email}</strong></p>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">密码</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} placeholder="输入登录密码" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" /></div>
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">{loading?"登录中...":"登录"}</button>
        <button type="button" onClick={()=>{setStep("emailInput");setError("")}} className="w-full text-center text-sm text-emerald-600 hover:underline">使用验证码登录</button>
        <button type="button" onClick={goBack} className="w-full text-center text-sm text-gray-400 hover:underline">← 更换邮箱</button>
      </form>)}
    </div>
  </div>);
}