import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '新手养宠指南 | 顺瑞益宠',
  description: '从零开始科学养宠。守宫、蛇类、龟类、观赏鱼新手入门全攻略。',
  keywords: '新手养宠,守宫入门,宠物蛇饲养,龟类饲养,观赏鱼开缸,爬宠指南',
};

const guides = [
  { slug: 'gecko', title: '🦎 守宫新手入门', desc: '豹纹守宫饲养全攻略：饲养箱选择、温度湿度控制、喂食频率、常见疾病预防。', color: 'from-amber-400 to-orange-400' },
  { slug: 'snake', title: '🐍 宠物蛇饲养基础', desc: '玉米蛇、王蛇入门指南：饲养环境搭建、喂食周期、蜕皮护理、安全须知。', color: 'from-green-400 to-emerald-400' },
  { slug: 'turtle', title: '🐢 龟类饲养环境搭建', desc: '水龟与半水龟的饲养环境配置：晒台、UVB灯、过滤系统、冬眠管理。', color: 'from-teal-400 to-cyan-400' },
  { slug: 'fish', title: '🐠 观赏鱼开缸指南', desc: '新手开缸完整流程：养水、硝化系统建立、鱼种选择、日常维护要点。', color: 'from-blue-400 to-indigo-400' },
];

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-3">新手养宠指南</h1>
        <p className="text-[#6b7280] text-[15px] md:text-lg">从零开始，科学养宠——为每一位新手宠物主人准备的完整指南</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {guides.map(g => (
          <Link key={g.slug} href={'/guide/' + g.slug}
            className="group rounded-2xl overflow-hidden shadow-sm border border-[#f3f4f6] hover:shadow-md transition-all duration-300">
            <div className={'h-2 bg-gradient-to-r ' + g.color}></div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#1f2937] group-hover:text-[#1a7f5a] transition-colors">{g.title}</h2>
              <p className="mt-3 text-[14px] text-[#6b7280] leading-relaxed">{g.desc}</p>
              <span className="inline-block mt-4 text-[13px] font-medium text-[#1a7f5a] group-hover:translate-x-1 transition-transform">开始阅读 →</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 bg-[#e8f5ef] rounded-2xl p-8 text-center">
        <h3 className="text-lg font-bold text-[#1a7f5a] mb-2">🤝 加入社区交流</h3>
        <p className="text-[13px] text-[#1a7f5a]/80 mb-4">在社区中与其他宠友交流饲养经验，获取更多实战技巧</p>
        <Link href="/b" className="inline-block rounded-full bg-[#1a7f5a] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#166b4b]">探索社区</Link>
      </div>

      <p className="text-center text-[11px] text-[#d1d5db] mt-10">内容由顺瑞益宠整理，转载请注明出处</p>
    </div>
  );
}