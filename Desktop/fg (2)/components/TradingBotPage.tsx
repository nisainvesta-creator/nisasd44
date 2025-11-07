import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { WalletStatus } from './WalletStatus';
import { TradingBotAppKitDemo } from './TradingBotAppKitDemo';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';

// Inline lightweight SVG icons to avoid external dependency on lucide-react
const Icon = (p: any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" className={p.className || 'w-4 h-4'}><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d={p.path} /></svg>;
const Activity = (props: any) => <Icon {...props} path="M3 12h3l3-9 4 18 3-12 4 6" />;
const TrendingUp = (props: any) => <Icon {...props} path="M3 17l6-6 4 4 8-8" />;
const TrendingDown = (props: any) => <Icon {...props} path="M21 7l-6 6-4-4-8 8" />;
const Settings = (props: any) => <Icon {...props} path="M12 8v4l3 3" />;
const Play = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor" className={props.className || 'w-4 h-4'}><path d="M5 3v18l15-9L5 3z" /></svg>;
const Pause = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor" className={props.className || 'w-4 h-4'}><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>;
const BarChart3 = (props: any) => <Icon {...props} path="M3 3v18h18" />;
const DollarSign = (props: any) => <Icon {...props} path="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />;
const Bot = (props: any) => <Icon {...props} path="M12 2v4M8 20v-2a4 4 0 0 1 8 0v2" />;
const Zap = (props: any) => <Icon {...props} path="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />;
const Target = (props: any) => <Icon {...props} path="M12 9a3 3 0 100 6 3 3 0 000-6z" />;
const AlertTriangle = (props: any) => <Icon {...props} path="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />;
const Clock = (props: any) => <Icon {...props} path="M12 7v5l3 3" />;
const Wallet = (props: any) => <Icon {...props} path="M2 7h20v10H2z" />;
const ArrowUpRight = (props: any) => <Icon {...props} path="M7 17L17 7M7 7h10v10" />;
const ArrowDownRight = (props: any) => <Icon {...props} path="M17 7v10H7" />;
const RefreshCw = (props: any) => <Icon {...props} path="M21 12a9 9 0 1 0-3.22 6.78L21 21" />;

interface TradingBotPageProps {
  isWalletConnected?: boolean;
  walletAddress?: string;
  walletType?: string;
}

interface BotStrategy {
  id: string;
  name: string;
  type: 'arbitrage' | 'grid' | 'dca' | 'momentum';
  status: 'active' | 'paused' | 'stopped';
  pair: string;
  profit24h: number;
  totalProfit: number;
  risk: 'low' | 'medium' | 'high';
  allocation: number;
  trades: number;
  winRate: number;
  lastUpdate: string;
}

interface PerformanceData {
  period: string;
  totalProfit: number;
  trades: number;
  winRate: number;
  profitChange: number;
}

export function TradingBotPage({ 
  isWalletConnected = false, 
  walletAddress = '',
  walletType = ''
}: TradingBotPageProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeFrame, setTimeFrame] = useState('24h');
  const [isAutoTradingEnabled, setIsAutoTradingEnabled] = useState(true);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);

  // Mock data
  const [botStrategies, setBotStrategies] = useState<BotStrategy[]>([
    {
      id: 'bot-1',
      name: 'ETH/USDT Arbitrage',
      type: 'arbitrage',
      status: 'active',
      pair: 'ETH/USDT',
      profit24h: 127.45,
      totalProfit: 2834.67,
      risk: 'low',
      allocation: 5000,
      trades: 24,
      winRate: 87.5,
      lastUpdate: '2 min ago'
    },
    {
      id: 'bot-2',
      name: 'BTC Grid Trading',
      type: 'grid',
      status: 'active',
      pair: 'BTC/USDT',
      profit24h: 89.32,
      totalProfit: 1456.23,
      risk: 'medium',
      allocation: 3000,
      trades: 16,
      winRate: 72.8,
      lastUpdate: '1 min ago'
    },
    {
      id: 'bot-3',
      name: 'DCA Strategy',
      type: 'dca',
      status: 'paused',
      pair: 'ETH/USDT',
      profit24h: 0,
      totalProfit: 892.15,
      risk: 'low',
      allocation: 2000,
      trades: 0,
      winRate: 94.2,
      lastUpdate: '1 hour ago'
    }
  ]);

  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    period: '24h',
    totalProfit: 216.77,
    trades: 40,
    winRate: 82.5,
    profitChange: 12.4
  });

  const [portfolioData, setPortfolioData] = useState({
    totalBalance: 15750.45,
    activeAllocation: 10000,
    availableBalance: 5750.45,
    dailyPnL: 216.77,
    totalPnL: 5182.05
  });

  useEffect(() => {
    const mockData = {
      '24h': { totalProfit: 216.77, trades: 40, winRate: 82.5, profitChange: 12.4 },
      '7d': { totalProfit: 1247.83, trades: 285, winRate: 79.8, profitChange: 8.7 },
      '30d': { totalProfit: 4892.15, trades: 1240, winRate: 81.2, profitChange: 15.3 }
    };
    setPerformanceData({ period: timeFrame, ...mockData[timeFrame as keyof typeof mockData] });
  }, [timeFrame]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);
  const formatPercentage = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

  const getBotTypeIcon = (type: string) => {
    switch (type) {
      case 'arbitrage': return <Zap className="w-4 h-4" />;
      case 'grid': return <BarChart3 className="w-4 h-4" />;
      case 'dca': return <Target className="w-4 h-4" />;
      case 'momentum': return <TrendingUp className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  const getRiskColor = (risk: string) => (risk === 'low' ? 'bg-green-500/20 text-green-400' : risk === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400');
  const getStatusColor = (status: string) => (status === 'active' ? 'bg-green-500/20 text-green-400' : status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400');

  const toggleBotStatus = (botId: string) => setBotStrategies(prev => prev.map(bot => bot.id === botId ? { ...bot, status: bot.status === 'active' ? 'paused' : 'active' } : bot));

  if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md bg-card border-border">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-brand/10 rounded-full flex items-center justify-center">
              <Wallet className="w-8 h-8 text-brand" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Connect Your Wallet</h3>
            <p className="text-muted-foreground mb-6">Connect your wallet to access advanced trading bot features and start automated trading strategies.</p>
            <Button className="w-full">Connect Wallet</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trading Bots</h1>
            <p className="text-muted-foreground">Automated trading strategies and portfolio management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Auto Trading</span>
              <Switch checked={isAutoTradingEnabled} onCheckedChange={setIsAutoTradingEnabled} />
            </div>
            <Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-2" />Settings</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border"><CardContent className="p-6"><div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">Total Balance</span><DollarSign className="w-4 h-4 text-brand" /></div><div className="text-2xl font-bold">{formatCurrency(portfolioData.totalBalance)}</div></CardContent></Card>

          <Card className="bg-card border-border"><CardContent className="p-6"><div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">Daily P&L</span>{performanceData.profitChange > 0 ? <ArrowUpRight className="w-4 h-4 text-green-400" /> : <ArrowDownRight className="w-4 h-4 text-red-400" />}</div><div className="text-2xl font-bold text-green-400">+{formatCurrency(portfolioData.dailyPnL)}</div><div className="text-sm text-green-400">{formatPercentage(performanceData.profitChange)}</div></CardContent></Card>

          <Card className="bg-card border-border"><CardContent className="p-6"><div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">Active Bots</span><Activity className="w-4 h-4 text-brand" /></div><div className="text-2xl font-bold">{botStrategies.filter(bot => bot.status === 'active').length}</div><div className="text-sm text-muted-foreground">of {botStrategies.length} total</div></CardContent></Card>

          <Card className="bg-card border-border"><CardContent className="p-6"><div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">Win Rate</span><Target className="w-4 h-4 text-brand" /></div><div className="text-2xl font-bold">{performanceData.winRate}%</div><div className="text-sm text-muted-foreground">{performanceData.trades} trades</div></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="bots">My Bots</TabsTrigger>
            <TabsTrigger value="create">Create Bot</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Performance Overview</CardTitle>
                  <div className="flex gap-2">
                    {['24h', '7d', '30d'].map((period) => (
                      <Button key={period} variant={timeFrame === period ? 'default' : 'outline'} size="sm" onClick={() => setTimeFrame(period)}>{period.toUpperCase()}</Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Performance chart would go here</p>
                    <p className="text-sm text-muted-foreground">Profit: {formatCurrency(performanceData.totalProfit)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader><CardTitle>Active Trading Bots</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {botStrategies.filter(bot => bot.status === 'active').map((bot) => (
                    <div key={bot.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center">{getBotTypeIcon(bot.type)}</div>
                        <div><div className="font-medium">{bot.name}</div><div className="text-sm text-muted-foreground">{bot.pair}</div></div>
                      </div>
                      <div className="text-right"><div className="font-medium text-green-400">+{formatCurrency(bot.profit24h)}</div><div className="text-sm text-muted-foreground">24h</div></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bots" className="space-y-6 mt-6">
            <div className="grid gap-4">
              {botStrategies.map((bot) => (
                <Card key={bot.id} className="bg-card border-border"><CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center">{getBotTypeIcon(bot.type)}</div>
                      <div>
                        <h3 className="font-semibold">{bot.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{bot.type.toUpperCase()}</Badge>
                          <Badge className={`text-xs ${getStatusColor(bot.status)}`}>{bot.status.toUpperCase()}</Badge>
                          <Badge className={`text-xs ${getRiskColor(bot.risk)}`}>{bot.risk.toUpperCase()} RISK</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleBotStatus(bot.id)}>{bot.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</Button>
                      <Button variant="outline" size="sm"><Settings className="w-4 h-4" /></Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div><div className="text-sm text-muted-foreground">Trading Pair</div><div className="font-medium">{bot.pair}</div></div>
                    <div><div className="text-sm text-muted-foreground">24h Profit</div><div className="font-medium text-green-400">+{formatCurrency(bot.profit24h)}</div></div>
                    <div><div className="text-sm text-muted-foreground">Total Profit</div><div className="font-medium text-green-400">+{formatCurrency(bot.totalProfit)}</div></div>
                    <div><div className="text-sm text-muted-foreground">Win Rate</div><div className="font-medium">{bot.winRate}%</div></div>
                    <div><div className="text-sm text-muted-foreground">Allocation</div><div className="font-medium">{formatCurrency(bot.allocation)}</div></div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" />Last update: {bot.lastUpdate}</div>
                      <div className="text-muted-foreground">{bot.trades} trades today</div>
                    </div>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-6 mt-6">
            <Card className="bg-card border-border"><CardHeader><CardTitle>Create New Trading Bot</CardTitle></CardHeader><CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border cursor-pointer hover:border-brand transition-colors"><CardContent className="p-6"><div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center"><Zap className="w-6 h-6 text-brand" /></div><div><h3 className="font-semibold">Arbitrage Bot</h3><p className="text-sm text-muted-foreground">Cross-exchange price differences</p></div></div><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Risk Level:</span><span className="text-green-400">Low</span></div><div className="flex justify-between"><span>Avg APY:</span><span>15-25%</span></div><div className="flex justify-between"><span>Min Amount:</span><span>$100</span></div></div></CardContent></Card>

                <Card className="border-border cursor-pointer hover:border-brand transition-colors"><CardContent className="p-6"><div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center"><BarChart3 className="w-6 h-6 text-brand" /></div><div><h3 className="font-semibold">Grid Trading</h3><p className="text-sm text-muted-foreground">Profit from market volatility</p></div></div><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Risk Level:</span><span className="text-yellow-400">Medium</span></div><div className="flex justify-between"><span>Avg APY:</span><span>20-40%</span></div><div className="flex justify-between"><span>Min Amount:</span><span>$500</span></div></div></CardContent></Card>

                <Card className="border-border cursor-pointer hover:border-brand transition-colors"><CardContent className="p-6"><div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center"><Target className="w-6 h-6 text-brand" /></div><div><h3 className="font-semibold">DCA Strategy</h3><p className="text-sm text-muted-foreground">Dollar cost averaging</p></div></div><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Risk Level:</span><span className="text-green-400">Low</span></div><div className="flex justify-between"><span>Avg APY:</span><span>10-20%</span></div><div className="flex justify-between"><span>Min Amount:</span><span>$50</span></div></div></CardContent></Card>

                <Card className="border-border cursor-pointer hover:border-brand transition-colors"><CardContent className="p-6"><div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center"><TrendingUp className="w-6 h-6 text-brand" /></div><div><h3 className="font-semibold">Momentum Trading</h3><p className="text-sm text-muted-foreground">Follow market trends</p></div></div><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Risk Level:</span><span className="text-red-400">High</span></div><div className="flex justify-between"><span>Avg APY:</span><span>30-60%</span></div><div className="flex justify-between"><span>Min Amount:</span><span>$1,000</span></div></div></CardContent></Card>
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border"><CardHeader><CardTitle>Performance Metrics</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex justify-between items-center"><span>Total Return</span><span className="font-medium text-green-400">+{formatCurrency(portfolioData.totalPnL)}</span></div><div className="flex justify-between items-center"><span>Sharpe Ratio</span><span className="font-medium">2.34</span></div><div className="flex justify-between items-center"><span>Max Drawdown</span><span className="font-medium text-red-400">-3.2%</span></div><div className="flex justify-between items-center"><span>Active Days</span><span className="font-medium">127</span></div></CardContent></Card>

              <Card className="bg-card border-border"><CardHeader><CardTitle>Risk Analysis</CardTitle></CardHeader><CardContent className="space-y-4"><div><div className="flex justify-between mb-2"><span>Portfolio Risk</span><span className="text-sm text-muted-foreground">Medium</span></div><Progress value={45} className="h-2" /></div><div><div className="flex justify-between mb-2"><span>Diversification</span><span className="text-sm text-muted-foreground">Good</span></div><Progress value={75} className="h-2" /></div><div><div className="flex justify-between mb-2"><span>Volatility</span><span className="text-sm text-muted-foreground">Low</span></div><Progress value={30} className="h-2" /></div></CardContent></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WalletStatus />
              <TradingBotAppKitDemo />
            </div>

            <Card className="bg-card border-border"><CardHeader><CardTitle>Recent Trading Activity</CardTitle></CardHeader><CardContent><div className="space-y-4">
              {[{ type: 'buy', pair: 'ETH/USDT', amount: '0.5 ETH', price: '$2,341.50', profit: '+$23.45', time: '2 min ago' },{ type: 'sell', pair: 'BTC/USDT', amount: '0.02 BTC', price: '$43,250.00', profit: '+$45.80', time: '5 min ago' },{ type: 'buy', pair: 'ETH/USDT', amount: '0.3 ETH', price: '$2,335.20', profit: '+$12.30', time: '8 min ago' }].map((trade, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${trade.type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      {trade.type === 'buy' ? <ArrowUpRight className="w-4 h-4 text-green-400" /> : <ArrowDownRight className="w-4 h-4 text-red-400" />}
                    </div>
                    <div><div className="font-medium">{trade.pair}</div><div className="text-sm text-muted-foreground">{trade.amount} @ {trade.price}</div></div>
                  </div>
                  <div className="text-right"><div className="font-medium text-green-400">{trade.profit}</div><div className="text-sm text-muted-foreground">{trade.time}</div></div>
                </div>
              ))}
            </div></CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
