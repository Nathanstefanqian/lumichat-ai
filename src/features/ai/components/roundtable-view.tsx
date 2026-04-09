import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, Send, Users, Sparkles, Settings2, Plus, 
  Trash2, History, MessageSquare, Wand2, Save, Edit2
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import axios from '@/lib/axios';
import { toast } from 'sonner';

interface Agent {
  _id?: string;
  name: string;
  avatar: string;
  role: string;
  persona: string;
  model: string;
  isSystem?: boolean;
}

interface DiscussionPoint {
  round: number;
  agent: string;
  model: string;
  content: string;
  timestamp: string;
}

interface RoundtableHistory {
  _id: string;
  title: string;
  rounds: number;
  agents: Agent[];
  createdAt: string;
  history: DiscussionPoint[];
}

export const RoundtableView: React.FC = () => {
  // 状态：基础设置
  const [topic, setTopic] = useState('');
  const [rounds, setRounds] = useState([10]);
  const [activeTab, setActiveTab] = useState('current');
  
  // 状态：人员设置
  const [presets, setPresets] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [isGeneratingPersona, setIsGeneratingPersona] = useState(false);
  const [newAgentDesc, setNewAgentDesc] = useState('');
  
  // 状态：讨论过程
  const [isDiscussing, setIsDiscussing] = useState(false);
  const [currentHistory, setCurrentHistory] = useState<DiscussionPoint[]>([]);
  const [discussionHistory, setDiscussionHistory] = useState<RoundtableHistory[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<RoundtableHistory | null>(null);
  
  // 状态：人员编辑器
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingAgent, setEditingAgent] = useState<Agent>({
    name: '',
    avatar: '👤',
    role: '',
    persona: '',
    model: 'doubao-seed-2.0-pro'
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('只能上传图片文件');
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await axios.post('/common/upload?folder=avatars', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEditingAgent({ ...editingAgent, avatar: res.data.url });
      toast.success('头像上传成功');
    } catch (err) {
      toast.error('上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const polishPersona = async () => {
    if (!editingAgent.persona.trim()) return toast.error('请先输入一些性格描述');
    setIsPolishing(true);
    try {
      const res = await axios.post('/ai/roundtable/polish-persona', { persona: editingAgent.persona });
      setEditingAgent({ ...editingAgent, persona: res.data.polishedPersona });
      toast.success('性格描述润色成功');
    } catch (err) {
      toast.error('润色失败，请重试');
    } finally {
      setIsPolishing(false);
    }
  };
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 初始化：获取预设人员和历史记录
  useEffect(() => {
    fetchPresets();
    fetchHistory();
  }, []);

  const fetchPresets = async () => {
    try {
      const res = await axios.get('/ai/roundtable/presets');
      const data = Array.isArray(res) ? res : res.data || [];
      setPresets(data);
      // 默认选中前 5 个
      if (selectedAgents.length === 0 && data.length > 0) {
        setSelectedAgents(data.slice(0, 5));
      }
    } catch (err) {
      console.error('获取预设失败:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/ai/roundtable/history');
      const data = Array.isArray(res) ? res : res.data || [];
      setDiscussionHistory(data);
    } catch (err) {
      console.error('获取历史失败:', err);
    }
  };

  const generatePersona = async () => {
    if (!newAgentDesc.trim()) return;
    setIsGeneratingPersona(true);
    try {
      const res = await axios.post('/ai/roundtable/generate-persona', { description: newAgentDesc });
      const generated = res.data;
      setEditingAgent({
        ...editingAgent,
        ...generated,
        model: 'doubao-seed-2.0-pro'
      });
      setIsEditorOpen(true); // 生成后打开编辑器供微调
      setNewAgentDesc('');
      toast.success(`AI 已生成角色初步画像: ${generated.name}`);
    } catch (err) {
      toast.error('生成角色画像失败');
    } finally {
      setIsGeneratingPersona(false);
    }
  };

  const saveAgent = async () => {
    if (!editingAgent.name || !editingAgent.role || !editingAgent.persona) {
      return toast.error('请填写完整的角色信息');
    }
    
    try {
      const res = await axios.post('/ai/roundtable/presets', editingAgent);
      const savedAgent = res.data;
      setPresets(prev => [savedAgent, ...prev]);
      setSelectedAgents(prev => [...prev, savedAgent]);
      setIsEditorOpen(false);
      toast.success('角色保存并已加入参会人员');
    } catch (err) {
      toast.error('保存角色失败');
    }
  };

  const startDiscussion = async () => {
    if (!topic.trim()) return toast.error('请输入讨论主题');
    if (selectedAgents.length < 2) return toast.error('请至少选择两位参会人员');
    
    setIsDiscussing(true);
    setCurrentHistory([]);
    setActiveTab('current');
    
    try {
      const tokenStorage = localStorage.getItem('auth-storage');
      let token = '';
      if (tokenStorage) {
        token = JSON.parse(tokenStorage).state.token;
      }
        
      const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://nest.nathanq.site';
      const agentsParam = encodeURIComponent(JSON.stringify(selectedAgents));
      const url = `${apiBase}/ai/roundtable?question=${encodeURIComponent(topic)}&rounds=${rounds[0]}&agents=${agentsParam}&token=${token}`;
      
      const eventSource = new EventSource(url);
      const tempHistory: DiscussionPoint[] = [];

      eventSource.onmessage = (event) => {
        const parsed = JSON.parse(event.data);
        const data = parsed.data || parsed;
        
        if (data.done) {
          eventSource.close();
          setIsDiscussing(false);
          // 保存到数据库
          saveDiscussion(tempHistory);
          return;
        }
        
        const point = { ...data, avatar: selectedAgents.find(a => a.name === data.agent)?.avatar || '👤' };
        tempHistory.push(point);
        setCurrentHistory(prev => [...prev, point]);
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsDiscussing(false);
        toast.error('讨论连接中断');
      };
    } catch (error) {
      setIsDiscussing(false);
    }
  };

  const saveDiscussion = async (finalHistory: DiscussionPoint[]) => {
    try {
      await axios.post('/ai/roundtable/save', {
        title: topic,
        rounds: rounds[0],
        agents: selectedAgents,
        history: finalHistory
      });
      fetchHistory();
      toast.success('讨论已自动保存');
    } catch (err) {
      console.error('保存失败:', err);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentHistory]);

  return (
    <div className="flex flex-col h-full w-full p-4 gap-4 overflow-hidden text-foreground">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        <div className="flex-none flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 shadow-sm">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Lumi AI 圆桌会议</h2>
          </div>
          <TabsList className="bg-muted/50 border border-border/50">
            <TabsTrigger value="current" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">正在讨论</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">会议配置</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">往期记录</TabsTrigger>
          </TabsList>
        </div>

        {/* 正在讨论面板 */}
        <TabsContent value="current" className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden outline-none">
          {!isDiscussing && currentHistory.length === 0 ? (
            <Card className="flex-1 flex flex-col items-center justify-center p-12 bg-card/50 border-muted-foreground/20 border-dashed border-2 shadow-sm">
              <Sparkles className="w-16 h-16 text-muted-foreground/40 mb-4 animate-pulse" />
              <p className="text-muted-foreground text-lg mb-6 font-medium">配置好会议后，开启一场深度对话吧</p>
              <Button onClick={() => setActiveTab('settings')} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                <Settings2 className="w-4 h-4 mr-2" /> 去配置会议
              </Button>
            </Card>
          ) : (
            <div className="flex-1 overflow-y-auto pr-4 space-y-6" ref={scrollRef}>
              {currentHistory.map((point, i) => (
                <DiscussionItem key={i} point={point} />
              ))}
              {isDiscussing && (
                <div className="flex items-center justify-center py-8 gap-3 text-primary animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">AI 正在激烈辩论中...</span>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* 会议配置面板 */}
        <TabsContent value="settings" className="outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="p-6 bg-card border-border/50 shadow-sm">
                <h3 className="text-sm font-bold text-muted-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" /> 议题设置
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-medium">讨论主题</label>
                    <Input 
                      placeholder="例如：如何评价 2026 年的 AI 全栈开发趋势？" 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="bg-muted/30 border-border h-12 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs text-muted-foreground font-medium">讨论轮数</label>
                      <span className="text-xs text-primary font-mono font-bold">{rounds[0]} 轮</span>
                    </div>
                    <Slider 
                      value={rounds} 
                      onValueChange={setRounds} 
                      max={30} 
                      min={5} 
                      step={1} 
                      className="py-4"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card border-border/50 shadow-sm">
                <h3 className="text-sm font-bold text-muted-foreground mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> 参会人员 ({selectedAgents.length}/8)
                  </div>
                  <button 
                    onClick={() => {
                      setEditingAgent({
                        name: '',
                        avatar: '👤',
                        role: '',
                        persona: '',
                        model: 'doubao-seed-2.0-pro'
                      });
                      setIsEditorOpen(true);
                    }}
                    className="text-[10px] flex items-center gap-1 text-primary hover:underline font-bold transition-all"
                  >
                    <Plus className="w-3 h-3" /> 手动创建
                  </button>
                </h3>
                <div className="flex flex-wrap gap-3 mb-6 min-h-[60px] p-4 bg-muted/20 rounded-xl border border-border/30">
                  {selectedAgents.map((agent, i) => (
                    <div key={i} className="group relative animate-in zoom-in-50 duration-300">
                      <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-2xl relative overflow-hidden group shadow-sm transition-transform hover:scale-105">
                        {agent.avatar && (agent.avatar.startsWith('http') || agent.avatar.startsWith('/')) ? (
                          <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                        ) : (
                          agent.avatar
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button 
                            onClick={() => {
                              setEditingAgent(agent);
                              setIsEditorOpen(true);
                            }}
                            className="text-white hover:text-primary p-1 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setSelectedAgents(prev => prev.filter(a => a.name !== agent.name))}
                            className="text-white hover:text-destructive p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground text-center block mt-1 truncate w-12 font-medium">{agent.name}</span>
                    </div>
                  ))}
                  {selectedAgents.length === 0 && <p className="text-muted-foreground/50 text-xs self-center italic">暂未选择人员</p>}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder="输入简要描述，让 AI 生成角色画像..." 
                      value={newAgentDesc}
                      onChange={(e) => setNewAgentDesc(e.target.value)}
                      className="bg-muted/30 border-border focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <Button 
                      onClick={generatePersona} 
                      disabled={isGeneratingPersona || !newAgentDesc}
                      className="bg-primary hover:bg-primary/90 shrink-0 shadow-md transition-all active:scale-95"
                    >
                      {isGeneratingPersona ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-3 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
                    {presets.map((agent, i) => {
                      const isSelected = selectedAgents.some(a => a.name === agent.name);
                      return (
                        <button
                          key={i}
                          disabled={isSelected || selectedAgents.length >= 8}
                          onClick={() => setSelectedAgents(prev => [...prev, agent])}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                            isSelected || selectedAgents.length >= 8 
                              ? 'opacity-30 grayscale cursor-not-allowed' 
                              : 'hover:bg-muted/50 hover:shadow-inner active:scale-95'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-xl overflow-hidden shadow-sm">
                            {agent.avatar && (agent.avatar.startsWith('http') || agent.avatar.startsWith('/')) ? (
                              <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                            ) : (
                              agent.avatar
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate w-full font-medium">{agent.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>

              <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px] shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                      {editingAgent._id ? '编辑角色' : '创建新角色'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      配置角色的详细信息，使其在圆桌会议中表现更真实。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="flex flex-col items-center gap-4 mb-2">
                      <div 
                        className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center text-4xl overflow-hidden cursor-pointer hover:border-primary hover:bg-primary/5 transition-all relative group shadow-inner"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {editingAgent.avatar && (editingAgent.avatar.startsWith('http') || editingAgent.avatar.startsWith('/')) ? (
                          <img src={editingAgent.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          editingAgent.avatar
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-xs text-white font-bold gap-1">
                          <Plus className="w-5 h-5" />
                          <span>上传图片</span>
                        </div>
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                          </div>
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileUpload}
                      />
                      <p className="text-[10px] text-muted-foreground font-medium italic">点击上传图片作为头像</p>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right text-muted-foreground font-bold">名字</Label>
                      <Input
                        id="name"
                        value={editingAgent.name}
                        onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                        className="col-span-3 bg-muted/30 border-border focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right text-muted-foreground font-bold">职业/角色</Label>
                      <Input
                        id="role"
                        value={editingAgent.role}
                        onChange={(e) => setEditingAgent({ ...editingAgent, role: e.target.value })}
                        className="col-span-3 bg-muted/30 border-border focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="persona" className="text-muted-foreground font-bold">性格描述 & 语言风格</Label>
                        <button
                          onClick={polishPersona}
                          disabled={isPolishing || !editingAgent.persona.trim()}
                          className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 disabled:opacity-50 transition-all font-bold active:scale-95"
                        >
                          {isPolishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          AI 润色
                        </button>
                      </div>
                      <Textarea
                        id="persona"
                        value={editingAgent.persona}
                        onChange={(e) => setEditingAgent({ ...editingAgent, persona: e.target.value })}
                        className="min-h-[120px] bg-muted/30 border-border focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="描述角色的性格特点、立场倾向、说话习惯等..."
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditorOpen(false)}
                      className="border-border text-muted-foreground hover:bg-muted transition-all active:scale-95"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={saveAgent}
                      className="bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-95"
                    >
                      <Save className="w-4 h-4 mr-2" /> 保存并使用
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-6">
              <Card className="p-6 bg-primary text-primary-foreground flex flex-col items-center text-center justify-center gap-4 shadow-xl shadow-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <Users className="w-12 h-12 animate-bounce-slow" />
                <div className="relative z-10">
                  <h4 className="font-bold text-lg tracking-tight">开启圆桌会议</h4>
                  <p className="text-xs text-primary-foreground/80 mt-2 font-medium">配置好后，五位顶尖 AI 模型将根据你的配置开始一场深度的头脑风暴。</p>
                </div>
                <Button 
                  onClick={startDiscussion} 
                  disabled={isDiscussing}
                  className="w-full bg-white text-primary hover:bg-white/95 font-bold h-12 rounded-xl shadow-lg transition-all active:scale-[0.98] relative z-10"
                >
                  {isDiscussing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                  立即发起讨论
                </Button>
              </Card>

            </div>
          </div>
        </TabsContent>

        {/* 往期记录面板 */}
        <TabsContent value="history" className="outline-none">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {discussionHistory.map((item) => (
                <button
                  key={item._id}
                  onClick={() => setSelectedHistory(item)}
                  className={`w-full text-left p-4 rounded-xl border transition-all active:scale-[0.98] ${
                    selectedHistory?._id === item._id 
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' 
                      : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <h4 className="font-bold text-sm truncate mb-1">{item.title}</h4>
                  <div className="flex justify-between items-center text-[10px] opacity-70 font-medium">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span>{item.rounds} 轮</span>
                  </div>
                </button>
              ))}
              {discussionHistory.length === 0 && (
                <div className="text-center py-12 opacity-50">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">暂无历史记录</p>
                </div>
              )}
            </div>
            
            <div className="md:col-span-3">
              {selectedHistory ? (
                <Card className="flex flex-col h-[600px] bg-card border-border shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold tracking-tight">{selectedHistory.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        参会人员: {selectedHistory.agents?.map(a => a.name).join(', ') || '未知'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="font-bold">{selectedHistory.rounds} 轮讨论</Badge>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {selectedHistory.history?.map((point, i) => (
                      <DiscussionItem 
                        key={i} 
                        point={{
                          ...point,
                          avatar: selectedHistory.agents?.find(a => a.name === point.agent)?.avatar
                        }} 
                      />
                    ))}
                    {(!selectedHistory.history || selectedHistory.history.length === 0) && (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20">
                        <MessageSquare className="w-12 h-12 opacity-20 mb-4" />
                        <p>该讨论记录暂无具体内容</p>
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                <Card className="h-[600px] flex flex-col items-center justify-center p-12 bg-card/50 border-border border-dashed border-2 text-muted-foreground/40 shadow-inner">
                  <History className="w-16 h-16 mb-4 opacity-10" />
                  <p className="font-medium">在左侧选择一个历史讨论进行查看</p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const DiscussionItem: React.FC<{ point: any }> = ({ point }) => (
  <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="w-10 h-10 rounded-full border-2 border-primary/20 bg-muted flex items-center justify-center text-2xl font-bold shrink-0 overflow-hidden shadow-sm">
      {point.avatar && (point.avatar.startsWith('http') || point.avatar.startsWith('/')) ? (
        <img src={point.avatar} alt={point.agent} className="w-full h-full object-cover" />
      ) : (
        point.avatar || point.agent[0]
      )}
    </div>
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-bold text-foreground/90">{point.agent}</span>
        <Badge variant="outline" className="text-[10px] py-0 border-border bg-muted/50 text-muted-foreground font-medium">
          {point.model}
        </Badge>
        <span className="text-[10px] text-muted-foreground/60 font-medium">
          {point.timestamp ? new Date(point.timestamp).toLocaleTimeString() : ''}
        </span>
        <span className="ml-auto text-[10px] font-mono font-bold text-primary/40">#Round {point.round}</span>
      </div>
      <Card className="p-4 bg-muted/30 border-border/50 text-foreground/80 leading-relaxed relative overflow-hidden group hover:shadow-md transition-all duration-300">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 group-hover:bg-primary transition-colors" />
        {point.content}
      </Card>
    </div>
  </div>
);
