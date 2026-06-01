import { createClient } from '@/lib/supabase/server';

async function getAnnouncements() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('announcements')
      .select('content')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(5);
    return (data || []).map((a: any) => a.content);
  } catch {
    return [];
  }
}

export default async function AnnouncementBar() {
  const announcements = await getAnnouncements();

  if (announcements.length === 0) {
    return (
      <div className="bg-[#fef3c7] border-b border-[#fde68a]">
        <div className="mx-auto max-w-6xl px-4 py-1.5">
          <p className="text-center text-[12px] md:text-[13px] text-[#92400e] font-medium">
            ⚠️ 平台严禁私下交易、禁止买卖保护动物。所有交易必须通过平台担保完成。违规者将永久封号。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fef3c7] border-b border-[#fde68a] overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-1.5">
        {announcements.length === 1 ? (
          <p className="text-center text-[12px] md:text-[13px] text-[#92400e] font-medium">
            {announcements[0]}
          </p>
        ) : (
          <div className="relative h-6 overflow-hidden">
            <div className="announcement-scroll flex flex-col animate-marquee-up">
              {announcements.map((text, i) => (
                <p key={i} className="text-center text-[12px] md:text-[13px] text-[#92400e] font-medium h-6 flex items-center justify-center shrink-0">
                  {text}
                </p>
              ))}
              {/* 复制一份实现无缝循环 */}
              {announcements.map((text, i) => (
                <p key={'dup-' + i} className="text-center text-[12px] md:text-[13px] text-[#92400e] font-medium h-6 flex items-center justify-center shrink-0">
                  {text}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
