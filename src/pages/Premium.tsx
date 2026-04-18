import React from "react";
import { Check, Star, Zap, Globe, ShieldCheck, Crown, Music2, Download, Infinity } from "lucide-react";
import { useToastStore } from "../store/toastStore";
import { motion } from "motion/react";
import clsx from "clsx";

export function Premium() {
  const { addToast } = useToastStore();

  const handleSelectPlan = (plan: string) => {
    addToast(`Đã chọn gói ${plan}. Hệ thống thanh toán đang được bảo trì (Demo)!`, "info");
  };

  const PlanCard = ({ title, price, features, recommended = false, index }: { 
    title: string, 
    price: string, 
    features: string[], 
    recommended?: boolean,
    index: number
  }) => (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.5 }}
      className={clsx(
        "p-10 rounded-[40px] flex flex-col transition-all duration-500 group relative overflow-hidden h-full border",
        recommended 
          ? "bg-gradient-to-br from-[#1ed760] to-[#1db954] text-black shadow-[0_30px_60px_rgba(30,215,96,0.25)] border-transparent scale-105 z-10" 
          : "bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.06] hover:border-white/20"
      )}
    >
      {recommended && (
        <div className="absolute top-6 right-6 bg-black text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center gap-2">
          <Crown size={12} className="text-[#1ed760]" />
          Phổ biến nhất
        </div>
      )}
      
      <div className="mb-8">
        <h3 className="text-3xl font-black mb-2 tracking-tighter uppercase">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black tracking-tight">{price}</span>
          <span className={clsx("text-sm font-bold opacity-60", recommended ? "text-black" : "text-zinc-500")}>/tháng</span>
        </div>
      </div>
      
      <div className="space-y-5 mb-12 flex-1">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className={clsx(
              "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm",
              recommended ? 'bg-black/10' : 'bg-[#1ed760]/10'
            )}>
              <Check size={14} strokeWidth={3} className={recommended ? "text-black" : "text-[#1ed760]"} />
            </div>
            <span className="text-sm font-bold leading-tight tracking-tight opacity-90">{feature}</span>
          </div>
        ))}
      </div>

      <button 
        onClick={() => handleSelectPlan(title)}
        className={clsx(
          "w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-xl",
          recommended 
            ? "bg-black text-white hover:bg-zinc-900" 
            : "bg-[#1ed760] text-black hover:bg-[#1db954]"
        )}
      >
        Đăng ký gói {title}
      </button>
    </motion.div>
  );

  return (
    <div className="max-w-7xl mx-auto py-20 px-8 flex flex-col gap-32">
      {/* Header Section */}
      <section className="text-center space-y-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-20 w-[600px] h-[300px] bg-[#1ed760]/5 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-3 text-[#1ed760] font-black tracking-[0.5em] uppercase text-[10px] mb-6"
        >
           <Crown size={20} fill="currentColor" />
           MusicEVE Premium Experience
        </motion.div>
        
        <h1 className="text-8xl font-black tracking-tighter text-white leading-none max-w-4xl mx-auto">
          Nâng tầm trải nghiệm <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1ed760] to-[#1db954]">âm nhạc</span> của bạn.
        </h1>
        
        <p className="text-xl text-zinc-500 font-bold max-w-2xl mx-auto leading-relaxed">
          Nghe nhạc không quảng cáo, chất lượng âm thanh Hi-Fi đỉnh cao và tải về mọi lúc mọi nơi.
        </p>
      </section>

      {/* Pricing Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
        <PlanCard 
          index={0}
          title="Cá nhân" 
          price="59.000đ" 
          features={[
            "Âm nhạc không quảng cáo", 
            "Tải xuống và nghe ngoại tuyến", 
            "Phát theo yêu cầu bất cứ lúc nào", 
            "Chất lượng âm thanh tiêu chuẩn cao"
          ]} 
        />
        <PlanCard 
          index={1}
          title="Gia đình" 
          price="99.000đ" 
          recommended={true}
          features={[
            "Lên đến 6 tài khoản Premium", 
            "Soundblock cho trẻ em", 
            "Danh sách phát Gia đình chung", 
            "Chất lượng âm thanh Lossless"
          ]} 
        />
        <PlanCard 
          index={2}
          title="Sinh viên" 
          price="29.000đ" 
          features={[
            "Tất cả quyền lợi gói Cá nhân", 
            "Mức giá ưu đãi cho sinh viên", 
            "Truy cập các sự kiện độc quyền", 
            "Yêu cầu xác minh chính chủ"
          ]} 
        />
      </section>

      {/* Benefits Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 py-20 border-t border-white/5">
        {[
          { icon: Zap, title: "Tải xuống ngay", desc: "Nghe nhạc không cần internet." },
          { icon: ShieldCheck, title: "Không quảng cáo", desc: "Tận hưởng âm nhạc liên tục." },
          { icon: Music2, title: "Âm thanh Hi-Fi", desc: "Độ phân giải âm thanh cực cao." },
          { icon: Infinity, title: "Phát vô hạn", desc: "Không giới hạn số lần bỏ qua." }
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="flex flex-col items-center text-center gap-6 group"
          >
            <div className="w-20 h-20 bg-white/[0.03] rounded-[28px] flex items-center justify-center group-hover:bg-[#1ed760]/10 border border-white/5 group-hover:border-[#1ed760]/20 transition-all duration-500 shadow-xl">
              <item.icon className="text-[#1ed760]" size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-white font-black text-lg tracking-tight group-hover:text-[#1ed760] transition-colors">{item.title}</h4>
              <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-br from-zinc-900 to-black rounded-[60px] p-20 text-center border border-white/5 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-20 opacity-5">
            <Crown size={300} />
         </div>
         <div className="relative z-10 space-y-10">
            <h2 className="text-5xl font-black tracking-tighter text-white">Bạn đã sẵn sàng để nâng tầm?</h2>
            <p className="text-zinc-400 font-bold max-w-xl mx-auto leading-relaxed">Tham gia cùng hàng triệu người yêu nhạc đang sử dụng MusicEVE Premium hàng ngày.</p>
            <button className="bg-white text-black px-12 py-5 rounded-full font-black text-sm uppercase tracking-[0.3em] hover:scale-110 active:scale-95 transition-all shadow-2xl">
               Bắt đầu dùng thử miễn phí
            </button>
         </div>
      </section>
    </div>
  );
}
