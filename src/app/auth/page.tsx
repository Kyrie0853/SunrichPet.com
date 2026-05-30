"use client";

import { useState, useRef } from "react";
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

type Step="emailInput"|"otpInput"|"registerConfirm"|"passwordLogin";

export default function AuthPage(){
  const router=useRouter();
  const supabase=createClient();
  const[step,setStep]=useState<Step>("emailInput");
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[code,setCode]=useState<string[]>([...Array(6)].map(()=>""));
  const[error,setError]=useState("");
  const[message,setMessage]=useState("");
  const[loading,setLoading]=useState(false);
  const[countdown,setCountdown]=useState(0);
  const codeRefs=useRef<(HTMLInputElement|null)[]>([]);

  const startCD=()=>{setCountdown(60);const t=setInterval(()=>{setCountdown(c=>{if(c<=1){clearInterval(t);return 0}return c-1})},1000)};

  async function checkEmail(e:React.FormEvent){
    e.preventDefault();setError("");if(!email.trim()){setError("请输入邮箱地址");return}
    setLoading(true);
    const{error:otpErr}=await supabase.auth.signInWithOtp({email:email.trim(),options:{shouldCreateUser:false}});
    if(otpErr){
      if(otpErr.message.includes("User not found")){
        // 邮箱未注册，引导用户注册
        setStep("registerConfirm");
      }else if(otpErr.message.includes("Signups not allowed")){
        // OTP 注册被禁用：可能是 Supabase 后台未开启，给管理员提示
        setError("该邮箱暂未注册，且系统暂不支持新用户注册。请联系管理员开启注册功能。");
      }else{
        setError(translateError(otpErr.message));
      }
      setLoading(false);return;
    }
    setMessage("验证码已发送至 "+email.trim());
    setStep("otpInput");startCD();setLoading(false);
  }

  async function registerViaOtp(){
    setError("");setLoading(true);
    const{error:otpErr}=await supabase.auth.signInWithOtp({email:email.trim(),options:{shouldCreateUser:true}});
    if(otpErr){setError(translateError(otpErr.message));setLoading(false);return}
    setMessage("验证码已发送，请输入6位验证码完成注册");
    setStep("otpInput");startCD();setLoading(false);
  }

  async function verifyOtp(){
    const otp=code.join("");
    if(otp.length!==6){setError("请输入完整的6位验证码");return}
    setError("");setLoading(true);
    const{error:vErr}=await supabase.auth.verifyOtp({email:email.trim(),token:otp,type:"email"});
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

  function handleCode(i:number,v:string){
    if(!/^\\d?$/.test(v))return;
    const nc=[...code];nc[i]=v;setCode(nc);
    if(v&&i<5)codeRefs.current[i+1]?.focus();
    if(i===5&&v&&[...nc.slice(0,5),v].join("").length===6)setTimeout(verifyOtp,200);
  }

  async function resendOtp(){
    if(countdown>0)return;setError("");setLoading(true);
    const{error:oErr}=await supabase.auth.signInWithOtp({email:email.trim(),options:{shouldCreateUser:true}});
    if(oErr){setError(translateError(oErr.message));setLoading(false);return}
    setMessage("验证码已重新发送");startCD();setLoading(false);
  }

  const goBack=()=>{setStep("emailInput");setError("");setMessage("");setCode([...Array(6)].map(()=>""))};

  return(<div className="flex min-h-[80vh] items-center justify-center px-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <h1 className="mb-2 text-center text-2xl font-bold text-emerald-700">顺瑞益宠</h1>
      <p className="mb-6 text-center text-sm text-gray-400">登录或注册账号</p>
      {message&&(<div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>)}
      {error&&(<div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>)}
      {step==="emailInput"&&(<form onSubmit={checkEmail} className="space-y-4">
        <div><label className="mb-1 block text-sm font-medium text-gray-700">邮箱地址</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="your@email.com" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" /></div>
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">{loading?"检测中...":"继续"}</button>
        <p className="text-center text-xs text-gray-400">已有账号？输入邮箱后可选密码或验证码登录</p>
      </form>)}
      {step==="otpInput"&&(<div className="space-y-4">
        <p className="text-sm text-gray-600">请输入发送到 <strong>{email}</strong> 的 6 位验证码</p>
        <div className="flex justify-center gap-2">
          {code.map((d,i)=>(<input key={i} ref={el=>{codeRefs.current[i]=el}} type="text" inputMode="numeric" maxLength={1} value={d} onChange={e=>handleCode(i,e.target.value)} className="h-12 w-12 rounded-lg border border-gray-300 text-center text-xl font-bold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />))}
        </div>
        <button onClick={verifyOtp} disabled={loading} className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">{loading?"验证中...":"确认登录"}</button>
        <div className="flex items-center justify-between text-sm">
          <button onClick={resendOtp} disabled={countdown>0} className="text-emerald-600 hover:underline disabled:text-gray-400">{countdown>0?countdown+" 秒后重发":"重新发送验证码"}</button>
          <button onClick={()=>{setStep("passwordLogin");setError("")}} className="text-gray-500 hover:underline">使用密码登录</button>
        </div>
        <button onClick={goBack} className="w-full text-center text-sm text-gray-400 hover:underline">← 更换邮箱</button>
      </div>)}
      {step==="registerConfirm"&&(<div className="space-y-4">
        <div className="rounded-lg bg-amber-50 p-4 text-center"><p className="text-sm text-amber-800">邮箱 <strong>{email}</strong> 尚未注册</p><p className="mt-1 text-xs text-amber-600">是否直接注册并登录？</p></div>
        <button onClick={registerViaOtp} disabled={loading} className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">{loading?"发送中...":"发送验证码注册"}</button>
        <button onClick={goBack} className="w-full text-center text-sm text-gray-400 hover:underline">← 更换邮箱</button>
      </div>)}
      {step==="passwordLogin"&&(<form onSubmit={passwordLogin} className="space-y-4">
        <p className="text-sm text-gray-600">使用密码登录 <strong>{email}</strong></p>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">密码</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} placeholder="输入登录密码" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" /></div>
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">{loading?"登录中...":"登录"}</button>
        <button type="button" onClick={()=>{setStep("otpInput");setError("")}} className="w-full text-center text-sm text-emerald-600 hover:underline">使用验证码登录</button>
        <button type="button" onClick={goBack} className="w-full text-center text-sm text-gray-400 hover:underline">← 更换邮箱</button>
      </form>)}
    </div>
  </div>);
}