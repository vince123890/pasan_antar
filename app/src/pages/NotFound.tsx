import { Link } from 'react-router-dom';
import { Empty } from '../components/ui';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg pt-16">
      <Empty icon="🧭" title="Halaman tidak ditemukan">
        <Link to="/" className="btn-primary mt-4">Ke beranda</Link>
      </Empty>
    </div>
  );
}
