import { useEffect, useState } from 'react';
import { emptyData, type CareData } from '@/lib/pet-care';
const KEY = 'tram-cham-boss-v1';
export function useCareData() {
  const [data, setData] = useState<CareData>(emptyData);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CareData;
        if (!Array.isArray(parsed.customers) || !Array.isArray(parsed.pets) || !Array.isArray(parsed.services) || !Array.isArray(parsed.bookings) || !parsed.capacity) throw new Error('Invalid data');
        setData(parsed);
      }
    } catch { setStorageError('Không thể đọc dữ liệu trên máy. Vui lòng kiểm tra bộ nhớ trình duyệt.'); }
    setReady(true);
    const sync = (event: StorageEvent) => { if (event.key === KEY && event.newValue) { try { setData(JSON.parse(event.newValue) as CareData); } catch { setStorageError('Không thể đồng bộ dữ liệu trên máy.'); } } };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  function save(next: CareData) {
    try { localStorage.setItem(KEY, JSON.stringify(next)); setData(next); setStorageError(''); return true; }
    catch { setStorageError('Không lưu được dữ liệu. Bộ nhớ trình duyệt có thể đã đầy hoặc bị chặn.'); return false; }
  }
  return { data, save, ready, storageError };
}