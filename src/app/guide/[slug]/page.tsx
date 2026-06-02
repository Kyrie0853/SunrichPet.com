import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

// Hardcoded fallback content for all 4 guides
const FALLBACKS: Record<string, { title: string; content: string }> = {
  gecko: {
    title: "守宫新手入门",
    content: "## 选择你的第一只守宫\n\n豹纹守宫是最适合新手的守宫品种。性格温顺、体型适中（成体18-25cm）、饲养难度低。\n\n### 热门入门品种\n- 豹纹守宫：温顺、易驯化、品系丰富\n- 睫角守宫：可喂食果泥、不需活虫\n- 肥尾守宫：与豹纹守宫类似，需稍高湿度\n\n## 饲养箱设置\n\n### 尺寸\n- 幼体：30x20x15cm\n- 成体：60x40x30cm\n\n### 必备设备\n- 加热垫（配温控器）：热区32-35度\n- 躲避穴 x2：热区一个、冷区一个\n- 水盆：浅口、不易打翻\n- 温湿度计\n\n### 垫材\n- 推荐：厨房纸巾（幼体）、宠物地毯、瓷砖\n- 避免：散沙（易误食导致肠梗阻）\n\n## 喂食指南\n\n| 阶段 | 频率 | 数量 |\n|------|------|------|\n| 幼体 | 每天 | 2-3只小蟋蟀 |\n| 亚成体 | 隔天 | 3-5只 |\n| 成体 | 2-3天/次 | 5-8只 |\n\n食物需沾钙粉+维生素D3粉末。\n\n## 常见问题\n\n**守宫不吃东西？** 检查温度、是否蜕皮期、是否新环境。\n\n**如何判断健康？** 尾巴饱满、眼睛明亮、行动敏捷。",
  },
  snake: {
    title: "宠物蛇饲养基础",
    content: "## 最佳入门品种\n\n### 玉米蛇\n- 体型：成体100-150cm\n- 寿命：15-20年\n- 性格：温顺、极少咬人\n- 难度：简单\n\n### 王蛇\n- 体型：成体90-120cm\n- 特点：色彩丰富、食欲旺盛\n- 注意：不可与其他蛇混养！\n\n## 饲养环境\n\n- 幼蛇饲养箱：30x20x15cm\n- 成蛇饲养箱：90x45x45cm\n- 热区：30-32度 / 冷区：24-26度\n- 湿度：40-60%\n\n### 必备设备\n- 加热垫/加热灯 + 温控器\n- 躲避穴 x2\n- 水盆（供饮水和泡澡）\n- 牢固的盖子（蛇是逃跑大师！）\n\n## 喂食\n\n- 幼蛇每周喂1次乳鼠\n- 成蛇每7-14天喂1次成体鼠\n- 喂食后48小时内不要打扰\n- 只喂冻鼠，不喂活鼠\n\n## 蜕皮护理\n\n- 蜕皮前眼睛变浑浊（蓝眼期）\n- 提高湿度至60-70%\n- 提供粗糙表面帮助蜕皮",
  },
  turtle: {
    title: "龟类饲养环境搭建",
    content: "## 水龟环境\n\n### 必备设备\n- 鱼缸/龟缸：至少龟壳长度的5倍\n- 过滤器：水龟排泄量大\n- 晒台：供龟爬出水面晒背\n- UVB灯 + UVA加热灯\n- 加热棒：水温保持24-28度\n\n### 水质管理\n- 每周换水30-50%\n- 使用除氯剂处理自来水\n- 定期清洗过滤器\n\n## 陆龟环境\n\n### 必备设备\n- 饲养箱/龟桌：至少120x60cm（成体）\n- UVB灯管：促进钙质吸收\n- 加热灯：晒点35-38度\n- 躲避穴、温湿度计\n\n### 垫材\n- 推荐：椰土+树皮混合\n\n## 喂食\n\n### 水龟\n- 主食：龟粮\n- 辅食：小鱼虾、蔬菜\n\n### 陆龟\n- 主食：深绿色蔬菜\n- 避免：菠菜（影响钙吸收）\n- 每周补充钙粉2-3次\n\n## 冬眠须知\n\n新手不建议让龟冬眠！冬眠不当死亡率很高。",
  },
  fish: {
    title: "观赏鱼开缸指南",
    content: "## 新手开缸7步走\n\n### 第1步：选缸\n- 新手推荐：30-60cm超白缸\n\n### 第2步：设备\n- 过滤器：外挂瀑布过滤（小缸）或滤筒（大缸）\n- 加热棒：热带鱼需24-28度\n- 灯光：LED灯，每天6-8小时\n- 底砂：水草泥或化妆砂\n\n### 第3步：养水（最重要！）\n- 加水后开启过滤和加热\n- 加入硝化细菌\n- 等待2-4周，期间不放入鱼\n- 测水质：氨=0、亚硝酸盐=0\n\n### 第4步：选鱼\n- 新手推荐：泰国斗鱼、米奇鱼、斑马鱼、灯科鱼\n- 新手避开：七彩神仙、魟鱼、海水鱼\n\n### 第5步：过水\n- 鱼袋放入缸中15分钟适应温度\n- 每5分钟加入少量缸水适应水质\n- 30分钟后用网捞出放入缸\n\n### 第6步：日常维护\n- 每周换水20-30%\n- 不要过量喂食（2分钟内吃完）\n- 检查鱼的行为和外观",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const f = FALLBACKS[slug];
  return { title: (f?.title || "指南") + " — 顺瑞益宠" };
}

function renderContent(text: string) {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />;
    if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-bold text-[#1f2937] mt-8 mb-3 pb-2 border-b">{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold text-[#1f2937] mt-6 mb-2">{line.slice(4)}</h3>;
    if (line.startsWith("| ")) {
      const cells = line.split("|").filter(c => c.trim());
      if (cells.every((c: string) => c.includes("---"))) return null;
      return <div key={i} className="flex gap-4 py-1.5 text-[14px] border-b border-gray-100">{cells.map((c: string, ci: number) => <span key={ci} className={ci === 0 ? "flex-1 font-medium text-[#1f2937]" : "flex-1 text-[#6b7280]"}>{c.trim()}</span>)}</div>;
    }
    if (line.startsWith("- ")) return <li key={i} className="ml-4 text-[15px] text-[#4b5563] leading-relaxed">{line.slice(2)}</li>;
    return <p key={i} className="text-[15px] text-[#4b5563] leading-relaxed">{line}</p>;
  });
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fallback = FALLBACKS[slug];

  // Try wiki_pages first
  let dbContent: string | null = null;
  let dbTitle: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("wiki_pages")
      .select("title, content")
      .eq("slug", "guide-" + slug)
      .eq("category", "guide")
      .eq("is_published", true)
      .maybeSingle();
    if (data?.content) { dbContent = data.content; dbTitle = data.title; }
  } catch {}

  const title = dbTitle || fallback?.title || "指南";
  const content = dbContent || fallback?.content;

  if (!content) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-5xl mb-4">📭</p>
        <h1 className="text-xl font-bold text-[#1f2937] mb-2">内容暂未编辑</h1>
        <p className="text-[#6b7280] mb-6">该指南页面还没有内容，欢迎贡献此页面</p>
        <Link href="/guide" className="rounded-full bg-[#1a7f5a] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#166b4b]">返回指南首页</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/guide" className="text-[13px] text-[#6b7280] hover:text-[#1a7f5a] mb-6 inline-block">&larr; 返回指南首页</Link>
      <h1 className="text-3xl font-bold text-[#1f2937] mb-2">{title}</h1>
      <p className="text-[#9ca3af] text-[13px] mb-8">新手养宠指南 · 社区共同维护</p>
      <div className="prose max-w-none">{renderContent(content)}</div>
      <div className="mt-12 pt-6 border-t flex flex-wrap gap-4">
        <Link href="/b" className="text-[13px] text-[#1a7f5a] hover:underline">社区交流 →</Link>
        <Link href="/encyclopedia" className="text-[13px] text-[#1a7f5a] hover:underline">品种百科 →</Link>
      </div>
      <p className="text-center text-[11px] text-[#d1d5db] mt-10">内容由社区共同维护，欢迎贡献你的经验</p>
    </div>
  );
}
