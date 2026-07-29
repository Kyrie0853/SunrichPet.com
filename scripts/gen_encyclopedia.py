import os

head = """-- ============================================================
-- 品种百科数据填充 - 100 种常见爬宠品种
-- 请在 Supabase SQL Editor 中执行此文件
-- ============================================================

CREATE TABLE IF NOT EXISTS public.encyclopedia_species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  latin TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  origin TEXT NOT NULL,
  size_cm TEXT,
  lifespan TEXT,
  temp_min INTEGER,
  temp_max INTEGER,
  humidity TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.encyclopedia_species ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read_encyclopedia ON public.encyclopedia_species;
CREATE POLICY public_read_encyclopedia ON public.encyclopedia_species FOR SELECT USING (true);

"""

data = [
# === 守宫 20种 ===
("leopard-gecko","豹纹守宫","Eublepharis macularius","守宫",2,"巴基斯坦/印度/阿富汗","18-25cm","10-20年",24,32,"30-40%","最受欢迎入门爬宠。性格温顺品系丰富上百种颜色变异。夜行性饲养极为简单。"),
("crested-gecko","睫角守宫","Correlophus ciliatus","守宫",2,"新喀里多尼亚","20-25cm","15-20年",22,26,"60-80%","一度被认为已灭绝1994年重新发现。可完全喂食专用果泥饲料。"),
("gargoyle-gecko","盖勾亚守宫","Rhacodactylus auriculatus","守宫",3,"新喀里多尼亚","20-23cm","15-20年",22,26,"60-80%","头部两侧有独特突起花纹变化丰富。适合有经验饲养者。"),
("fat-tailed-gecko","肥尾守宫","Hemitheconyx caudicinctus","守宫",2,"西非","18-25cm","10-18年",26,32,"50-70%","与豹纹守宫相似但需更高湿度。尾巴肥厚储存脂肪性格温和。"),
("tokay-gecko","大壁虎","Gekko gecko","守宫",4,"东南亚/中国南部","30-40cm","10-20年",26,32,"60-80%","体型较大色彩艳丽蓝灰橙斑。性格凶猛咬合力强不适合新手。"),
("day-gecko","马岛日行守宫","Phelsuma madagascariensis","守宫",3,"马达加斯加","20-28cm","10-15年",26,30,"60-80%","鲜艳翠绿色日行性需要UVB灯。皮肤脆弱不可抓握。"),
("golden-gecko","金粉守宫","Gekko badenii","守宫",3,"东南亚","18-25cm","8-12年",26,30,"70-80%","金黄色体色性格温顺但皮肤易损。需要高湿度立体空间。"),
("mourning-gecko","哀悼守宫","Lepidodactylus lugubris","守宫",1,"太平洋岛屿","8-10cm","5-10年",22,28,"70-80%","全雌性孤雌繁殖不需雄性。体型小巧适合小型生态缸群养。"),
("chinese-cave-gecko","中国洞穴守宫","Goniurosaurus hainanensis","守宫",3,"中国海南","18-22cm","8-12年",22,26,"70-85%","中国本土守宫品种眼部红色橙色环纹。喜欢凉爽潮湿环境。"),
("leachie-gecko","巨人守宫","Rhacodactylus leachianus","守宫",4,"新喀里多尼亚","30-40cm","20-30年",22,26,"60-80%","现存最大守宫成体可达400g+。价格昂贵需大型饲养空间。"),
("satanic-leaf-tail","撒旦叶尾守宫","Uroplatus phantasticus","守宫",5,"马达加斯加","8-12cm","5-10年",18,24,"80-90%","伪装大师外形酷似枯叶。饲养难度极高仅推荐专业饲养者。"),
("knob-tailed-gecko","瘤尾守宫","Nephrurus levis","守宫",3,"澳大利亚","10-14cm","8-12年",28,34,"30-40%","尾巴末端小球状突起外形独特。澳洲品种。"),
("viper-gecko","蝰蛇守宫","Hemidactylus imbricatus","守宫",2,"中东南亚","8-12cm","5-8年",28,34,"40-50%","全身鳞片叠瓦状排列外形似小蛇。体型小巧。"),
("banded-gecko","西部斑纹守宫","Coleonyx variegatus","守宫",2,"北美沙漠","12-15cm","8-15年",26,32,"30-50%","北美本土守宫有眼睑外形可爱。"),
("pictus-gecko","马岛侏儒守宫","Paroedura picta","守宫",2,"马达加斯加","12-18cm","5-8年",26,30,"50-70%","体型小巧地栖守宫性格活泼繁殖容易适合新手。"),
("african-fat-tail","非洲肥尾守宫","Hemitheconyx caudicinctus","守宫",2,"西非","18-25cm","10-15年",26,32,"50-70%","豹纹守宫近亲品系丰富包括白化条纹等变异。"),
("leopard-gecko-blizzard","暴风雪豹纹守宫","Eublepharis macularius morph","守宫",2,"人工选育","18-25cm","10-20年",24,32,"30-40%","纯白无纹品系完全无斑点纯白色极受收藏者欢迎。"),
("leopard-gecko-tangerine","橘化豹纹守宫","Eublepharis macularius morph","守宫",2,"人工选育","18-25cm","10-20年",24,32,"30-40%","橙色品系体色鲜艳。颜色越深价值越高。"),
("leopard-gecko-raptor","RAPTOR豹纹守宫","Eublepharis macularius morph","守宫",2,"人工选育","18-25cm","10-20年",24,32,"30-40%","全红眼无纹品系。Ruby-eyed Albino Patternless Tremper Orange。"),
("leopard-gecko-mack-snow","麦克斯诺豹纹守宫","Eublepharis macularius morph","守宫",2,"人工选育","18-25cm","10-20年",24,32,"30-40%","黑白配色品系幼体黑白分明。显性基因。"),
# === 蛇类 25种 ===
("corn-snake","玉米蛇","Pantherophis guttatus","蛇类",1,"北美","100-150cm","15-20年",24,30,"40-60%","最佳入门宠物蛇色彩丰富数十种品系。性格温顺极少咬人。"),
("ball-python","球蟒","Python regius","蛇类",2,"西非/中非","100-150cm","20-30年",26,32,"50-60%","全球最受欢迎宠物蛇之一品系极其丰富。有时会拒食。"),
("kingsnake","加州王蛇","Lampropeltis californiae","蛇类",2,"北美西部","90-120cm","15-20年",24,30,"40-50%","色彩鲜艳黑白环纹最常见食欲旺盛。会吃其他蛇必须单独饲养。"),
("milk-snake","牛奶蛇","Lampropeltis triangulum","蛇类",2,"北美/中美","60-120cm","12-20年",24,30,"40-60%","红黑黄三色环纹有毒蛇拟态实为无毒。性格略胆小。"),
("rosy-boa","玫瑰蚺","Lichanura trivirgata","蛇类",2,"北美西南部","60-90cm","20-30年",24,30,"40-50%","体型粗壮温顺有粉色橙色条纹。三种北美蚺中最适合新手。"),
("kenyan-sand-boa","肯尼亚沙蚺","Eryx colubrinus","蛇类",2,"东非","50-80cm","15-20年",28,34,"30-40%","体型粗短有趣大部分时间埋在沙中仅露头部。"),
("western-hognose","西部猪鼻蛇","Heterodon nasicus","蛇类",3,"北美","40-80cm","12-18年",26,32,"30-50%","吻部上翘似猪鼻外形可爱。有轻微毒液对人无害会装死。"),
("green-tree-python","绿树蟒","Morelia viridis","蛇类",4,"新几内亚/澳大利亚","150-180cm","15-20年",26,30,"70-80%","翡翠般翠绿色栖息于树枝上呈盘状。牙齿较长不适合上手。"),
("emerald-tree-boa","翡翠树蚺","Corallus caninus","蛇类",4,"南美亚马逊","150-200cm","15-20年",26,30,"80-90%","与绿树蟒极为相似。牙齿更长性格更敏感。"),
("carpet-python","地毯蟒","Morelia spilota","蛇类",3,"澳大利亚/新几内亚","150-250cm","20-25年",26,32,"50-60%","花纹如波斯地毯般华丽。多个亚种体长不一。"),
("brazilian-rainbow-boa","巴西彩虹蚺","Epicrates cenchria","蛇类",3,"南美","150-200cm","20-25年",26,30,"70-80%","鳞片阳光下呈现彩虹光泽。需高湿度。"),
("dumerils-boa","杜氏蚺","Acrantophis dumerili","蛇类",3,"马达加斯加","150-200cm","15-20年",26,30,"50-60%","马达加斯加地栖蚺花纹精致。性格极其温顺。"),
("garter-snake","束带蛇","Thamnophis sirtalis","蛇类",2,"北美","50-90cm","8-12年",22,28,"40-60%","北美最常见野生蛇类人工繁殖个体适合做宠物。部分可群养。"),
("rat-snake","黑鼠蛇","Pantherophis obsoletus","蛇类",1,"北美","150-250cm","15-25年",22,28,"40-60%","北美大型游蛇纯黑发亮。耐寒进食积极饲养简单。"),
("bullsnake","牛蛇","Pituophis catenifer","蛇类",2,"北美","150-250cm","15-25年",24,30,"30-50%","北美体型最大蛇类之一生气时发出嘶嘶声。食欲旺盛。"),
("spotted-python","斑点星点蟒","Antaresia maculosa","蛇类",1,"澳大利亚","90-120cm","15-20年",28,34,"40-50%","最佳新手蟒蛇之一体型适中性格温顺从不咬人。"),
("woma-python","沃马蟒","Aspidites ramsayi","蛇类",3,"澳大利亚内陆","150-200cm","20-25年",28,34,"30-40%","澳洲沙漠蟒蛇头部扁平独特性格温和。"),
("boa-constrictor","红尾蚺","Boa constrictor","蛇类",4,"中南美洲","200-350cm","20-30年",26,32,"60-70%","经典大型宠物蛇需较大空间和力量管理不适合新手。"),
("burmese-python","缅甸蟒","Python bivittatus","蛇类",5,"东南亚","300-500cm","20-30年",26,32,"50-70%","全球最大蛇类之一仅推荐专家。白化品系最受欢迎。"),
("rough-green-snake","绿滑蛇","Opheodrys aestivus","蛇类",3,"北美","60-90cm","6-8年",22,28,"60-70%","全身翠绿体型纤细主食昆虫。少数可喂食虫类蛇之一。"),
("sunbeam-snake","阳光蛇","Xenopeltis unicolor","蛇类",3,"东南亚","80-100cm","8-12年",26,30,"70-80%","鳞片光线下呈现彩虹色极为惊艳。穴居习性。"),
("trans-pecos-rat-snake","跨佩科斯鼠蛇","Bogertophis subocularis","蛇类",2,"美墨边境","120-150cm","12-18年",24,30,"30-50%","大眼睛温顺北美鼠蛇凸眼给人可爱印象。"),
("colombian-rainbow-boa","哥伦比亚彩虹蚺","Epicrates maurus","蛇类",2,"哥伦比亚","120-150cm","15-20年",26,30,"60-70%","彩虹蚺中体型较小饲养较容易的亚种。"),
("childrens-python","童蟒","Antaresia childreni","蛇类",2,"澳大利亚","60-90cm","15-25年",28,34,"40-50%","澳洲小型蟒蛇体型小巧适合空间有限者。"),
("ringneck-python","环颈蟒","Bothrochilus boa","蛇类",2,"巴布亚新几内亚","100-150cm","15-20年",26,30,"60-70%","幼体有醒目橙色环纹随成长渐褪。性格温顺小型蟒蛇。"),
# === 龟类 15种 ===
("red-eared-slider","巴西龟","Trachemys scripta elegans","龟类",2,"北美","20-30cm","20-40年",24,28,"水栖","全球最常见宠物龟适应性强。需充足阳光和清洁水质。"),
("russian-tortoise","四爪陆龟","Testudo horsfieldii","龟类",3,"中亚","15-25cm","40-60年",26,35,"30-50%","体型较小的陆龟适合室内饲养需UVB和钙质补充。"),
("hermanns-tortoise","赫曼陆龟","Testudo hermanni","龟类",3,"南欧","15-25cm","50-70年",24,32,"40-60%","地中海陆龟中最受欢迎品种性格活泼外形精致。"),
("sulcata-tortoise","苏卡达陆龟","Centrochelys sulcata","龟类",5,"非洲撒赫勒","60-80cm","50-100年",28,38,"20-30%","世界第三大陆龟成体可达100kg+。生长极快非新手品种。"),
("red-footed-tortoise","红腿陆龟","Chelonoidis carbonarius","龟类",3,"南美","30-40cm","30-50年",24,30,"70-80%","南美热带雨林陆龟腿部有红色鳞片需较高湿度。"),
("musk-turtle","麝香龟","Sternotherus odoratus","龟类",1,"北美东部","8-14cm","30-50年",22,28,"水栖","体型最小水龟品种之一适合小空间。受惊释放麝香味。"),
("map-turtle","地图龟","Graptemys geographica","龟类",3,"北美","15-25cm","15-20年",24,28,"水栖","龟壳花纹如地图等高线对水质要求较高。"),
("painted-turtle","锦龟","Chrysemys picta","龟类",2,"北美","12-25cm","20-30年",22,28,"水栖","北美分布最广水龟龟壳边缘红色花纹色彩鲜艳。"),
("box-turtle","箱龟","Terrapene carolina","龟类",3,"北美东部","12-18cm","30-50年",22,28,"60-80%","独特铰链式腹甲可完全闭合半水栖需高湿度。"),
("indian-star-tortoise","印度星龟","Geochelone elegans","龟类",4,"印度/斯里兰卡","20-30cm","30-50年",28,35,"50-70%","龟壳花纹如星星般美丽对温湿度变化敏感。"),
("radiated-tortoise","辐射陆龟","Astrochelys radiata","龟类",4,"马达加斯加","35-40cm","50-80年",26,32,"50-60%","龟壳放射状花纹被誉为最美陆龟CITES I级保护。"),
("leopard-tortoise","豹纹陆龟","Stigmochelys pardalis","龟类",3,"非洲东部/南部","40-60cm","50-80年",26,32,"40-60%","龟壳有豹纹斑点花纹非洲第四大陆龟。"),
("african-sideneck","非洲侧颈龟","Pelomedusa subrufa","龟类",2,"非洲","15-25cm","20-30年",24,28,"水栖","颈部无法缩入壳内折叠到侧面性格有趣。"),
("greek-tortoise","希腊陆龟","Testudo graeca","龟类",3,"地中海/中东","15-28cm","50-80年",24,32,"40-60%","后腿有独特刺状鳞片。"),
("mata-mata","枯叶龟","Chelus fimbriata","龟类",4,"南美亚马逊","40-50cm","15-20年",26,30,"水栖","外形奇特头部扁平如枯叶通过张嘴吸入猎物。"),
# === 蜥蜴 15种 ===
("bearded-dragon","鬃狮蜥","Pogona vitticeps","蜥蜴",2,"澳大利亚内陆","40-60cm","8-12年",26,38,"30-40%","最受欢迎宠物蜥蜴性格温顺互动性强可上手需UVB灯。"),
("blue-tongue-skink","蓝舌石龙子","Tiliqua scincoides","蜥蜴",2,"澳大利亚/印尼","45-60cm","15-20年",26,32,"40-60%","蓝色舌头标志性特征体型粗壮性格温顺行动缓慢。"),
("green-iguana","绿鬣蜥","Iguana iguana","蜥蜴",4,"中南美洲","150-200cm","10-15年",28,35,"70-80%","最常见宠物鬣蜥但饲养难度不低需巨大空间和植物性饮食。"),
("chinese-water-dragon","中国水龙","Physignathus cocincinus","蜥蜴",3,"东南亚/中国南部","60-90cm","10-15年",26,32,"70-80%","翠绿色半水栖蜥蜴外形似小龙需大型高饲养箱和水池。"),
("uromastyx","刺尾蜥","Uromastyx aegyptia","蜥蜴",3,"北非/中东","30-75cm","15-20年",30,45,"20-30%","沙漠蜥蜴尾巴有尖刺纯素食需极高温度。"),
("green-anole","绿安乐蜥","Anolis carolinensis","蜥蜴",2,"北美东南部","15-20cm","4-8年",24,30,"60-70%","北美本土小型变色蜥蜴可改变颜色喉部粉红色喉扇。"),
("frilled-lizard","伞蜥","Chlamydosaurus kingii","蜥蜴",4,"澳大利亚/新几内亚","60-90cm","10-15年",28,35,"40-60%","受惊展开颈部巨大伞状皮膜极其壮观。"),
("armadillo-lizard","犰狳蜥","Ouroborus cataphractus","蜥蜴",3,"南非","15-20cm","10-15年",24,30,"30-50%","受惊咬住尾巴盘成球状如犰狳防御群居可小群饲养。"),
("fire-skink","火石龙子","Lepidothyris fernandi","蜥蜴",2,"西非","25-35cm","8-12年",26,30,"60-70%","身体两侧鲜艳红橙色条纹穴居习性。"),
("caiman-lizard","凯门蜥","Dracaena guianensis","蜥蜴",5,"南美亚马逊","100-130cm","10-15年",26,30,"70-80%","大型半水栖蜥蜴头部似凯门鳄主食蜗牛蛤蜊。"),
("tegu","阿根廷黑白泰加","Salvator merianae","蜥蜴",5,"南美","100-140cm","15-20年",28,35,"60-70%","世界最聪明蜥蜴之一可像狗训练体型巨大。"),
("sudan-plated-lizard","苏丹盾甲蜥","Gerrhosaurus major","蜥蜴",2,"非洲","40-60cm","10-15年",26,32,"40-60%","身体覆盖方形鳞片如铠甲性格温顺。"),
("monkey-tailed-skink","猴尾石龙子","Corucia zebrata","蜥蜴",3,"所罗门群岛","60-80cm","15-25年",24,28,"70-80%","唯一纯植食性有抓握尾石龙子群居需大型箱。"),
("emerald-swift","翡翠速蜥","Sceloporus malachiticus","蜥蜴",3,"中美洲","15-20cm","5-8年",24,30,"60-70%","雄性全身翠绿色极为美丽动作敏捷不宜频繁上手。"),
("basilisk-lizard","双冠蜥","Basiliscus plumifrons","蜥蜴",4,"中美洲","60-80cm","7-10年",26,32,"70-80%","又名耶稣蜥蜴可在水面短距离奔跑头部冠状突起。"),
# === 两栖 10种 ===
("axolotl","墨西哥钝口螈","Ambystoma mexicanum","两栖",3,"墨西哥","15-30cm","10-15年",16,20,"水栖","著名六角恐龙保持幼体形态蝾螈需低温水质多种颜色品系。"),
("pacman-frog","角蛙","Ceratophrys cranwelli","两栖",2,"南美","10-15cm","6-10年",24,28,"70-80%","又名吃豆蛙嘴大贪吃色彩变异丰富。"),
("whites-tree-frog","白氏树蛙","Litoria caerulea","两栖",1,"澳大利亚/新几内亚","7-11cm","10-15年",24,28,"50-70%","最佳新手树蛙体型肥胖可爱表情呆萌性格温顺。"),
("red-eyed-tree-frog","红眼树蛙","Agalychnis callidryas","两栖",3,"中美洲","5-7cm","5-8年",24,28,"70-80%","标志性红色眼睛绿色身体蓝色侧纹橙色脚趾观赏性极高。"),
("poison-dart-frog","钴蓝箭毒蛙","Dendrobates tinctorius","两栖",3,"南美苏里南","4-6cm","8-12年",22,26,"80-90%","鲜艳蓝色带黑斑人工饲养下无毒适合雨林生态缸。"),
("fire-bellied-toad","东方铃蟾","Bombina orientalis","两栖",1,"东亚","4-6cm","10-15年",20,26,"水陆各半","小型半水栖蟾蜍腹部鲜艳红橙色斑纹受惊展示警告色。"),
("tiger-salamander","虎纹蝾螈","Ambystoma tigrinum","两栖",2,"北美","15-25cm","10-15年",16,22,"60-70%","世界最大陆栖蝾螈黄色橄榄色条纹穴居习性。"),
("african-bullfrog","非洲牛蛙","Pyxicephalus adspersus","两栖",3,"非洲南部","15-25cm","15-25年",24,30,"50-70%","世界最大蛙类之一雄性可达2kg贪吃凶猛。"),
("amazon-milk-frog","亚马逊牛奶蛙","Trachycephalus resinifictrix","两栖",2,"南美亚马逊","6-10cm","8-12年",24,28,"70-80%","灰白色带棕色斑纹受惊分泌乳白色液体树栖。"),
("fire-salamander","火蝾螈","Salamandra salamandra","两栖",3,"欧洲","15-25cm","10-20年",14,20,"70-80%","黑色底色黄色斑点条纹欧洲经典两栖需凉爽环境。"),
# === 节肢 10种 ===
("chilean-rose-tarantula","智利红玫瑰捕鸟蛛","Grammostola rosea","节肢",1,"智利/玻利维亚","12-15cm","15-20年雌",22,28,"50-60%","最佳新手捕鸟蛛性格极其温顺几乎从不咬人。"),
("mexican-red-knee","墨西哥红膝头","Brachypelma smithi","节肢",2,"墨西哥","14-16cm","20-25年雌",24,28,"60-70%","经典宠物捕鸟蛛黑色配橙红膝关节CITES II保护。"),
("brazilian-black","巴西黑","Grammostola pulchra","节肢",1,"巴西/乌拉圭","14-16cm","20-25年雌",22,28,"50-60%","全身黑丝绒般纯黑温顺美丽成长极为缓慢。"),
("green-bottle-blue","绿瓶蓝","Chromatopelma cyaneopubescens","节肢",2,"委内瑞拉","12-14cm","8-12年雌",24,28,"50-60%","金属蓝腿绿背甲橙腹部色彩最绚丽捕鸟蛛之一。"),
("pink-toe-tarantula","粉趾捕鸟蛛","Avicularia avicularia","节肢",2,"南美北部","12-14cm","8-10年雌",24,28,"70-80%","脚趾粉红色树栖性格温和但动作敏捷。"),
("emperor-scorpion","帝王蝎","Pandinus imperator","节肢",1,"西非","15-20cm","6-8年",24,30,"70-80%","世界最大蝎子之一毒液微弱性格温顺群居可混养。"),
("giant-african-millipede","非洲巨型马陆","Archispirostreptus gigas","节肢",1,"东非","20-30cm","5-7年",22,26,"70-80%","世界最大千足虫纯素食温顺可上手。"),
("blue-death-feigning-beetle","蓝死甲虫","Asbolus verrucosus","节肢",1,"北美沙漠","2-3cm","5-8年",24,30,"20-30%","灰蓝色外壳受惊时装死群居纯干养极简宠物。"),
("madagascar-hissing-cockroach","马岛发声蟑螂","Gromphadorhina portentosa","节肢",1,"马达加斯加","5-8cm","2-3年",22,28,"50-60%","大型无翅蟑螂通过气孔发出嘶嘶声。"),
("ghost-mantis","幽灵螳螂","Phyllocrania paradoxa","节肢",2,"非洲","4-6cm","6-12月",24,28,"60-70%","外形如枯叶伪装极佳性格温和可群养。"),
# === 小宠 5种 ===
("hedgehog","非洲迷你刺猬","Atelerix albiventris","小宠",2,"非洲","15-20cm","3-5年",24,28,"40-50%","四趾刺猬人工选育白腹无刺夜行性独居需保温。"),
("sugar-glider","蜜袋鼯","Petaurus breviceps","小宠",4,"澳大利亚/新几内亚","15-20cm","8-12年",24,28,"50-60%","有滑翔膜夜行有袋类需群居大量互动和特殊饮食。"),
("chinchilla","龙猫","Chinchilla lanigera","小宠",3,"南美安第斯山脉","25-35cm","10-15年",16,22,"30-50%","拥有最柔软皮毛怕热需沙浴。"),
("guinea-pig","豚鼠","Cavia porcellus","小宠",1,"南美驯化","20-30cm","5-7年",18,24,"40-60%","温和群居草食动物会发出多种叫声需补充维生素C。"),
("rabbit","侏儒兔","Oryctolagus cuniculus","小宠",2,"欧洲驯化","20-30cm","8-12年",18,24,"40-60%","荷兰侏儒兔最受欢迎需干草为主饮食和充足空间。"),
]

with open("D:/SunrichPet.com/docs/seed-encyclopedia.sql", "w", encoding="utf-8") as f:
    f.write(head)
    for s in data:
        slug,name,latin,cat,diff,origin,size,life,tmin,tmax,hum,desc = s
        ds = desc.replace("'","''")
        f.write(f"INSERT INTO public.encyclopedia_species(slug,name,latin,category,difficulty,origin,size_cm,lifespan,temp_min,temp_max,humidity,description) VALUES('{slug}','{name}','{latin}','{cat}',{diff},'{origin}','{size}','{life}',{tmin},{tmax},'{hum}','{ds}') ON CONFLICT(slug) DO NOTHING;\n")
    f.write(f"\n-- Total: {len(data)} species (batch 1)\n")

print(f"Wrote {len(data)} species")
