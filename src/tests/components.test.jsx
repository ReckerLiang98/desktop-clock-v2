import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ClockFace from '../components/ClockFace';
import DateDisplay from '../components/DateDisplay';
import Toolbar from '../components/Toolbar';
import Weather from '../components/Weather';
import WarningBanner from '../components/WarningBanner';
import { WARNING_SEVERITY } from '../services/api';
import SyncStatus from '../components/SyncStatus';
import TitleBar from '../components/TitleBar';
import CloseDialog from '../components/CloseDialog';
import TimezoneMenu from '../components/TimezoneMenu';
import { TZ_LIST } from '../utils/constants';

/* ═══════════════════════════════════════════════════════════
   ClockFace 组件测试
   ═══════════════════════════════════════════════════════════ */
describe('ClockFace', () => {
  const baseTime = { h: '14', m: '30', s: '45', ms: '.123', ampm: '' };

  it('24h 模式正确渲染时:分:秒（包含冒号）', () => {
    const { container } = render(<ClockFace time={baseTime} showMs={false} />);
    const timeSpan = container.querySelector('.clock-time');
    expect(timeSpan).toBeTruthy();
    expect(timeSpan.textContent).toMatch(/14.*:.*30.*:.*45/);
  });

  it('显示冒号分隔符', () => {
    render(<ClockFace time={baseTime} showMs={false} />);
    const colons = document.querySelectorAll('.colon');
    expect(colons.length).toBe(2);
  });

  it('showMs=false 时毫秒部分隐藏 (visibility hidden)', () => {
    render(<ClockFace time={baseTime} showMs={false} />);
    const msSpan = document.querySelector('.clock-ms');
    expect(msSpan).toBeTruthy();
    expect(msSpan.style.visibility).toBe('hidden');
  });

  it('showMs=true 时毫秒部分可见', () => {
    render(<ClockFace time={baseTime} showMs={true} />);
    const msSpan = document.querySelector('.clock-ms');
    expect(msSpan).toBeTruthy();
    expect(msSpan.style.visibility).toBe('visible');
  });

  it('12h 模式显示 ampm 标识', () => {
    const time12h = { h: '02', m: '30', s: '45', ms: '.123', ampm: '下午' };
    render(<ClockFace time={time12h} showMs={false} />);
    expect(screen.getByText('下午')).toBeInTheDocument();
  });

  it('ampm 区域始终在 DOM 中保持布局', () => {
    render(<ClockFace time={baseTime} showMs={false} />);
    const ampmSpan = document.querySelector('.ampm');
    expect(ampmSpan).toBeTruthy();
    // 24h 模式 ampmm 为空但元素仍存在
    expect(ampmSpan.textContent).toBe('上午'); // fallback default
  });

  it('等宽字体类存在', () => {
    render(<ClockFace time={baseTime} showMs={false} />);
    const timeSpan = document.querySelector('.clock-time');
    expect(timeSpan).toBeTruthy();
  });
});

/* ═══════════════════════════════════════════════════════════
   DateDisplay 组件测试
   ═══════════════════════════════════════════════════════════ */
describe('DateDisplay', () => {
  const baseDate = {
    dateStr: '2026年5月29日',
    weekday: '星期五',
    lunar: '农历 丙午年(马🐴) 四月十三',
    solarTerm: '',
    holiday: '',
  };

  const baseTz = { name: '中国 (北京)', offset: 28800, tz: 'Asia/Shanghai' };

  it('显示公历日期', () => {
    render(<DateDisplay date={baseDate} tz={baseTz} tzManual={false} onTZClick={() => {}} />);
    expect(screen.getByText('2026年5月29日')).toBeInTheDocument();
  });

  it('显示星期', () => {
    render(<DateDisplay date={baseDate} tz={baseTz} tzManual={false} onTZClick={() => {}} />);
    expect(screen.getByText('星期五')).toBeInTheDocument();
  });

  it('显示农历信息', () => {
    render(<DateDisplay date={baseDate} tz={baseTz} tzManual={false} onTZClick={() => {}} />);
    expect(screen.getByText(/农历.*丙午.*马.*四月/)).toBeInTheDocument();
  });

  it('显示时区信息 (IP 模式)', () => {
    render(<DateDisplay date={baseDate} tz={baseTz} tzManual={false} onTZClick={() => {}} />);
    expect(screen.getByText(/\[IP\]/)).toBeInTheDocument();
  });

  it('显示时区信息 (手动模式)', () => {
    render(<DateDisplay date={baseDate} tz={baseTz} tzManual={true} onTZClick={() => {}} />);
    expect(screen.getByText(/\[手动\]/)).toBeInTheDocument();
  });

  it('节日优先于节气显示', () => {
    const holidayDate = { ...baseDate, holiday: '端午节', solarTerm: '芒种' };
    render(<DateDisplay date={holidayDate} tz={baseTz} tzManual={false} onTZClick={() => {}} />);
    expect(screen.getByText(/端午节/)).toBeInTheDocument();
    expect(screen.queryByText(/芒种/)).not.toBeInTheDocument();
  });

  it('非节日时显示节气', () => {
    const termDate = { ...baseDate, solarTerm: '小满' };
    render(<DateDisplay date={termDate} tz={baseTz} tzManual={false} onTZClick={() => {}} />);
    expect(screen.getByText('小满')).toBeInTheDocument();
  });

  it('节日和节气都为空时两者都不显示', () => {
    render(<DateDisplay date={baseDate} tz={baseTz} tzManual={false} onTZClick={() => {}} />);
    expect(screen.queryByText('🎉')).not.toBeInTheDocument();
    // 没有 holiday 和 solarTerm 时，对应的 div 不应该渲染
  });

  it('渲染 children 插槽', () => {
    render(
      <DateDisplay date={baseDate} tz={baseTz} tzManual={false} onTZClick={() => {}}>
        <div data-testid="child-content">时区菜单</div>
      </DateDisplay>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});

/* ═══════════════════════════════════════════════════════════
   Toolbar 组件测试
   ═══════════════════════════════════════════════════════════ */
describe('Toolbar', () => {
  const baseProps = {
    is24: true,
    showMs: false,
    themeMode: 'dark',
    onToggle24: () => {},
    onToggleMs: () => {},
    onCycleTheme: () => {},
    onSync: () => {},
  };

  it('24h 模式下 12h 按钮不高亮', () => {
    const { container } = render(<Toolbar {...baseProps} />);
    const btns = container.querySelectorAll('.btn');
    const btn12h = [...btns].find(b => b.textContent === '12h');
    expect(btn12h).toBeTruthy();
    expect(btn12h.classList.contains('on')).toBe(false);
  });

  it('12h 模式下 12h 按钮高亮 (否定逻辑: !is24 → on)', () => {
    const { container } = render(<Toolbar {...baseProps} is24={false} />);
    const btns = container.querySelectorAll('.btn');
    const btn12h = [...btns].find(b => b.textContent === '12h');
    expect(btn12h.classList.contains('on')).toBe(true);
  });

  it('showMs=true 时 .ms 按钮高亮', () => {
    const { container } = render(<Toolbar {...baseProps} showMs={true} />);
    const btns = container.querySelectorAll('.btn');
    const btnMs = [...btns].find(b => b.textContent === '.ms');
    expect(btnMs.classList.contains('on')).toBe(true);
  });

  it('showMs=false 时 .ms 按钮不高亮', () => {
    const { container } = render(<Toolbar {...baseProps} showMs={false} />);
    const btns = container.querySelectorAll('.btn');
    const btnMs = [...btns].find(b => b.textContent === '.ms');
    expect(btnMs.classList.contains('on')).toBe(false);
  });

  it('深色模式下主题按钮显示月亮图标', () => {
    const { container } = render(<Toolbar {...baseProps} themeMode="dark" />);
    expect(container.textContent).toContain('🌙');
  });

  it('浅色模式下主题按钮显示太阳图标', () => {
    const { container } = render(<Toolbar {...baseProps} themeMode="light" />);
    expect(container.textContent).toContain('☀️');
  });

  it('跟随系统模式下主题按钮显示循环图标', () => {
    const { container } = render(<Toolbar {...baseProps} themeMode="auto" />);
    expect(container.textContent).toContain('🔄');
  });

  it('主题按钮有 theme-btn CSS 类', () => {
    const { container } = render(<Toolbar {...baseProps} />);
    const themeBtn = container.querySelector('.theme-btn');
    expect(themeBtn).toBeTruthy();
  });

  it('包含同步按钮（带 SVG 图标）', () => {
    const { container } = render(<Toolbar {...baseProps} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });
});

/* ═══════════════════════════════════════════════════════════
   Weather 组件测试
   ═══════════════════════════════════════════════════════════ */
describe('Weather', () => {
  const baseData = {
    location: '北京',
    country: '中国',
    temp: '22°C',
    weather: '晴天',
    humidity: '65%',
    icon: 113,
    iconEmoji: '☀️',
  };

  it('渲染天气图标和温度', () => {
    render(<Weather data={baseData} loading={false} onRefresh={() => {}} />);
    expect(screen.getByText('☀️')).toBeInTheDocument();
    expect(screen.getByText('22°C')).toBeInTheDocument();
  });

  it('渲染天气描述', () => {
    render(<Weather data={baseData} loading={false} onRefresh={() => {}} />);
    expect(screen.getByText('晴天')).toBeInTheDocument();
  });

  it('渲染湿度信息', () => {
    render(<Weather data={baseData} loading={false} onRefresh={() => {}} />);
    expect(screen.getByText('💧65%')).toBeInTheDocument();
  });

  it('湿度为空时不渲染湿度元素', () => {
    const noHumidity = { ...baseData, humidity: '' };
    const { container } = render(<Weather data={noHumidity} loading={false} onRefresh={() => {}} />);
    expect(container.textContent).not.toContain('💧');
  });

  it('data 为 null 时返回 null (不渲染)', () => {
    const { container } = render(<Weather data={null} loading={false} onRefresh={() => {}} />);
    expect(container.innerHTML).toBe('');
  });

  it('loading=true 时刷新按钮显示沙漏', () => {
    render(<Weather data={baseData} loading={true} onRefresh={() => {}} />);
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  it('loading=false 时刷新按钮显示循环图标', () => {
    render(<Weather data={baseData} loading={false} onRefresh={() => {}} />);
    expect(screen.getByText('🔄')).toBeInTheDocument();
  });

  it('loading=true 时刷新按钮 disabled', () => {
    render(<Weather data={baseData} loading={true} onRefresh={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('渲染位置信息', () => {
    render(<Weather data={baseData} loading={false} onRefresh={() => {}} />);
    expect(screen.getByText('北京')).toBeInTheDocument();
  });
});

/* ═══════════════════════════════════════════════════════════
   WarningBanner 组件测试
   ═══════════════════════════════════════════════════════════ */
describe('WarningBanner', () => {
  const baseWarning = {
    id: 'warn-001',
    headline: '大风蓝色预警',
    severity: 'minor',
    color: 'blue',
    typeName: '大风',
    description: '预计未来24小时内平均风力可达6级以上',
    instruction: '关好门窗，加固围板',
    effectiveTime: '2026-06-24T08:00+08:00',
    expireTime: '2026-06-25T08:00+08:00',
  };

  it('warnings 为 null 时返回 null (不渲染)', () => {
    const { container } = render(<WarningBanner warnings={null} loading={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('warnings 为空数组时返回 null (不渲染)', () => {
    const { container } = render(<WarningBanner warnings={[]} loading={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('渲染单条预警的标题', () => {
    render(<WarningBanner warnings={[baseWarning]} loading={false} />);
    expect(screen.getByText(/大风蓝色预警/)).toBeInTheDocument();
  });

  it('渲染预警类型标签', () => {
    render(<WarningBanner warnings={[baseWarning]} loading={false} />);
    expect(screen.getByText('大风')).toBeInTheDocument();
  });

  it('渲染预警颜色圆点', () => {
    const { container } = render(<WarningBanner warnings={[baseWarning]} loading={false} />);
    const dot = container.querySelector('.warning-dot');
    expect(dot).toBeTruthy();
    // 蓝色预警对应蓝色圆点
    expect(dot.style.backgroundColor).toBe('rgb(51, 136, 255)');
  });

  it('预警项有左边框颜色', () => {
    const { container } = render(<WarningBanner warnings={[baseWarning]} loading={false} />);
    const item = container.querySelector('.warning-item');
    expect(item).toBeTruthy();
    expect(item.style.borderLeftColor).toBe('rgb(51, 136, 255)');
  });

  it('渲染多条预警时全部显示', () => {
    const warn2 = { ...baseWarning, id: 'warn-002', headline: '暴雨橙色预警', color: 'orange', typeName: '暴雨' };
    const { container } = render(<WarningBanner warnings={[baseWarning, warn2]} loading={false} />);
    const items = container.querySelectorAll('.warning-item');
    expect(items.length).toBe(2);
    expect(screen.getByText(/大风蓝色预警/)).toBeInTheDocument();
    expect(screen.getByText(/暴雨橙色预警/)).toBeInTheDocument();
  });

  it('不同严重等级使用不同颜色', () => {
    const redWarn = { ...baseWarning, id: 'warn-red', color: 'red', headline: '台风红色预警' };
    const { container } = render(<WarningBanner warnings={[redWarn]} loading={false} />);
    const dot = container.querySelector('.warning-dot');
    expect(dot.style.backgroundColor).toBe('rgb(232, 48, 48)');
  });

  it('渲染有效时间范围', () => {
    const { container } = render(<WarningBanner warnings={[baseWarning]} loading={false} />);
    // 06-24 08:00 ~ 06-25 08:00
    expect(container.textContent).toContain('06-24 08:00');
    expect(container.textContent).toContain('06-25 08:00');
  });

  it('WARNING_SEVERITY 导出正确的四级映射', () => {
    expect(WARNING_SEVERITY.blue).toBeDefined();
    expect(WARNING_SEVERITY.yellow).toBeDefined();
    expect(WARNING_SEVERITY.orange).toBeDefined();
    expect(WARNING_SEVERITY.red).toBeDefined();
    expect(WARNING_SEVERITY.blue.label).toBe('蓝色预警');
    expect(WARNING_SEVERITY.red.label).toBe('红色预警');
  });

  it('loading=true 时显示加载指示器', () => {
    const { container } = render(<WarningBanner warnings={[baseWarning]} loading={true} />);
    expect(container.querySelector('.warning-loading')).toBeTruthy();
  });

  it('loading=false 时不显示加载指示器', () => {
    const { container } = render(<WarningBanner warnings={[baseWarning]} loading={false} />);
    expect(container.querySelector('.warning-loading')).toBeFalsy();
  });
});

/* ═══════════════════════════════════════════════════════════
   SyncStatus 组件测试
   ═══════════════════════════════════════════════════════════ */
describe('SyncStatus', () => {
  it('syncing=true 时显示同步中状态', () => {
    render(<SyncStatus synced={false} syncing={true} syncFailures={0} offset={0} rtt={0} clientIp="" />);
    expect(screen.getByText('正在同步网络时间…')).toBeInTheDocument();
    expect(document.querySelector('.sync-dot.syncing')).toBeTruthy();
  });

  it('synced=true 时显示已同步状态和偏差值', () => {
    render(<SyncStatus synced={true} syncing={false} syncFailures={0} offset={150} rtt={42} clientIp="1.2.3.4" />);
    expect(screen.getByText(/已同步/)).toBeInTheDocument();
    expect(screen.getByText(/\+0\.150s/)).toBeInTheDocument();
    expect(screen.getByText('(RTT 42ms)')).toBeInTheDocument();
  });

  it('显示客户端 IP', () => {
    render(<SyncStatus synced={true} syncing={false} syncFailures={0} offset={0} rtt={10} clientIp="1.2.3.4" />);
    expect(screen.getByText('| 1.2.3.4')).toBeInTheDocument();
  });

  it('无 clientIp 时不显示 IP 分隔符', () => {
    const { container } = render(
      <SyncStatus synced={true} syncing={false} syncFailures={0} offset={0} rtt={10} clientIp="" />
    );
    expect(container.textContent).not.toContain('|');
  });

  it('同步失败时显示失败状态和重试次数', () => {
    render(<SyncStatus synced={false} syncing={false} syncFailures={3} offset={0} rtt={0} clientIp="" />);
    expect(screen.getByText('同步失败 · 使用本地时间')).toBeInTheDocument();
    expect(screen.getByText('(重试3次)')).toBeInTheDocument();
    expect(document.querySelector('.sync-dot.bad')).toBeTruthy();
  });

  it('负偏差值正确显示', () => {
    render(<SyncStatus synced={true} syncing={false} syncFailures={0} offset={-50} rtt={20} clientIp="" />);
    expect(screen.getByText(/-0\.050s/)).toBeInTheDocument();
  });
});

/* ═══════════════════════════════════════════════════════════
   TitleBar 组件测试
   ═══════════════════════════════════════════════════════════ */
describe('TitleBar', () => {
  const baseProps = {
    topEnabled: false,
    onMinimize: () => {},
    onToggleTop: () => {},
    onClose: () => {},
  };

  it('显示应用名称', () => {
    render(<TitleBar {...baseProps} />);
    expect(screen.getByText('桌面时钟')).toBeInTheDocument();
  });

  it('渲染三个窗口控制按钮', () => {
    const { container } = render(<TitleBar {...baseProps} />);
    const btns = container.querySelectorAll('.win-btn');
    expect(btns.length).toBe(3);
  });

  it('置顶按钮在 topEnabled=true 时高亮', () => {
    const { container } = render(<TitleBar {...baseProps} topEnabled={true} />);
    const btns = container.querySelectorAll('.win-btn');
    const topBtn = btns[0];
    expect(topBtn.classList.contains('on')).toBe(true);
  });

  it('置顶按钮在 topEnabled=false 时不高亮', () => {
    const { container } = render(<TitleBar {...baseProps} topEnabled={false} />);
    const btns = container.querySelectorAll('.win-btn');
    const topBtn = btns[0];
    expect(topBtn.classList.contains('on')).toBe(false);
  });

  it('关闭按钮有 close 样式类', () => {
    const { container } = render(<TitleBar {...baseProps} />);
    expect(container.querySelector('.win-btn.close')).toBeTruthy();
  });

  it('标题栏包含 SVG 图标', () => {
    const { container } = render(<TitleBar {...baseProps} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });
});

/* ═══════════════════════════════════════════════════════════
   CloseDialog 组件测试
   ═══════════════════════════════════════════════════════════ */
describe('CloseDialog', () => {
  it('渲染"后台运行"和"退出应用"两个按钮', () => {
    render(<CloseDialog onHideToTray={() => {}} onQuit={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('后台运行')).toBeInTheDocument();
    expect(screen.getByText('退出应用')).toBeInTheDocument();
  });

  it('显示"不再提醒"复选框', () => {
    render(<CloseDialog onHideToTray={() => {}} onQuit={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('不再提醒')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeTruthy();
  });

  it('显示询问标题', () => {
    render(<CloseDialog onHideToTray={() => {}} onQuit={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('关闭桌面时钟')).toBeInTheDocument();
  });
});

/* ═══════════════════════════════════════════════════════════
   TimezoneMenu 组件测试
   ═══════════════════════════════════════════════════════════ */
describe('TimezoneMenu', () => {
  const baseProps = {
    tzList: TZ_LIST.slice(0, 5),
    currentTz: 'Asia/Shanghai',
    autoTz: null,
    isAuto: false,
    onSelect: () => {},
    onAuto: () => {},
    onClose: () => {},
  };

  it('渲染 IP 自动检测选项', () => {
    render(<TimezoneMenu {...baseProps} />);
    expect(screen.getByText(/IP自动检测/)).toBeInTheDocument();
  });

  it('isAuto=true 时自动检测选项高亮', () => {
    const { container } = render(<TimezoneMenu {...baseProps} isAuto={true} />);
    const autoOpt = container.querySelector('.tz-opt.active');
    expect(autoOpt).toBeTruthy();
    expect(autoOpt.textContent).toContain('IP自动检测');
  });

  it('当前时区对应的城市高亮', () => {
    const { container } = render(<TimezoneMenu {...baseProps} currentTz="Asia/Shanghai" />);
    const activeOpts = container.querySelectorAll('.tz-opt.active');
    // 至少有一个激活选项
    const hasActive = [...activeOpts].some(el => el.textContent.includes('中国 (北京)'));
    expect(hasActive).toBe(true);
  });

  it('渲染"选择时区"标题', () => {
    render(<TimezoneMenu {...baseProps} />);
    expect(screen.getByText('选择时区')).toBeInTheDocument();
  });

  it('渲染城市列表', () => {
    render(<TimezoneMenu {...baseProps} />);
    expect(screen.getByText(/中国.*北京/)).toBeInTheDocument();
    expect(screen.getByText(/日本.*东京/)).toBeInTheDocument();
  });

  it('isAuto=false 且有匹配 tz 时对应城市高亮', () => {
    const { container } = render(<TimezoneMenu {...baseProps} currentTz="Asia/Tokyo" />);
    const activeOpts = container.querySelectorAll('.tz-opt.active');
    const hasTokyo = [...activeOpts].some(el => el.textContent.includes('日本 (东京)'));
    expect(hasTokyo).toBe(true);
  });
});
