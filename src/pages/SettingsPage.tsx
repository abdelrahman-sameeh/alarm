import { BellDot, BellRing, ChevronLeft, Clock3, Info, ShieldCheck, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Toggle } from '../components/Toggle'
import { exactAlarmStatus, openExactAlarmSettings, prepareNotifications } from '../services/alarmScheduler'
import { useAlarms } from '../store/useAlarms'

export function SettingsPage() {
  const { settings, updateSettings } = useAlarms()
  const [permissionText, setPermissionText] = useState(() =>
    Capacitor.isNativePlatform() ? 'جاري الفحص...' : 'هيتفعّل على نسخة Android',
  )
  const refreshPermission = async () => {
    if (!Capacitor.isNativePlatform()) return
    const status = await exactAlarmStatus()
    setPermissionText(status === 'granted' ? 'مفعّل' : 'محتاج تفعيل')
  }
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    void exactAlarmStatus().then((status) => {
      setPermissionText(status === 'granted' ? 'مفعّل' : 'محتاج تفعيل')
    })
  }, [])

  return (
    <div className="page settings-page">
      <header className="top-bar"><div><p className="eyebrow">خلي كل حاجة مظبوطة</p><h1>الإعدادات</h1></div><span className="header-icon"><ShieldCheck size={24} /></span></header>
      <section className="settings-hero">
        <span><BellRing size={29} /></span>
        <div><strong>جاهزية المنبه</strong><p>فعّل الإشعارات والمنبهات الدقيقة عشان الرنة تشتغل في معادها.</p></div>
      </section>
      <section className="settings-list">
        <button type="button" onClick={() => void prepareNotifications().then(refreshPermission)}>
          <span className="setting-icon"><Smartphone size={21} /></span><span><strong>إذن الإشعارات</strong><small>اسمح للتطبيق يعرض المنبه</small></span><ChevronLeft size={19} />
        </button>
        <button type="button" onClick={() => void openExactAlarmSettings().then(refreshPermission)}>
          <span className="setting-icon"><Clock3 size={21} /></span><span><strong>المنبهات الدقيقة</strong><small>{permissionText}</small></span><ChevronLeft size={19} />
        </button>
      </section>
      <section className="form-card reminder-settings">
        <div className="setting-row">
          <div><strong><BellDot size={17} /> تذكير قبل المنبه</strong><span>Notification هادية قبل معاد الرنة</span></div>
          <Toggle
            checked={settings.reminderEnabled}
            onChange={(reminderEnabled) => updateSettings({ reminderEnabled })}
            label="تذكير قبل المنبه"
          />
        </div>
        {settings.reminderEnabled && (
          <div className="reminder-options">
            <label htmlFor="reminder-minutes">فكرني قبلها بكام دقيقة؟</label>
            <div className="reminder-input-row">
              <input
                id="reminder-minutes"
                type="number"
                inputMode="numeric"
                min="1"
                max="180"
                value={settings.reminderMinutes}
                onChange={(event) => updateSettings({ reminderMinutes: Number(event.target.value) || 1 })}
              />
              <span>دقيقة</span>
            </div>
            <div className="reminder-presets">
              {[5, 10, 15, 30, 60].map((minutes) => (
                <button
                  type="button"
                  className={settings.reminderMinutes === minutes ? 'selected' : ''}
                  key={minutes}
                  onClick={() => updateSettings({ reminderMinutes: minutes })}
                >
                  {minutes}
                </button>
              ))}
            </div>
            <p>من نفس الإشعار تقدر تتخطى منبه النهارده أو توقفه دائمًا.</p>
          </div>
        )}
      </section>
      <section className="info-note"><Info size={18} /><p>على بعض موبايلات Android لازم تستثني التطبيق من توفير البطارية عشان المنبهات المهمة ما تتأخرش.</p></section>
      <footer className="version-footer">alarm · إصدار 0.2.0</footer>
    </div>
  )
}
