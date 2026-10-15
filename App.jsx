import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen, Search, ShoppingCart, UserRound, Plus, Heart, PackageCheck,
  ClipboardList, ShieldCheck, X, ChevronRight, CheckCircle2, Trash2,
  BookMarked, ArrowRight, SlidersHorizontal, GraduationCap, Store
} from 'lucide-react';

const seedBooks = [
  { id: 1, title: '아몬드', author: '손원평', publisher: '창비', isbn: '9788936434267', category: '소설/시', price: 7000, originalPrice: 15000, condition: '상', description: '표지에 약간의 사용감이 있으며 본문은 깨끗합니다.', status: '판매 중', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=500&q=80' },
  { id: 2, title: '불편한 편의점', author: '김호연', publisher: '나무옆의자', isbn: '9788934983074', category: '소설/시', price: 6000, originalPrice: 14000, condition: '중', description: '모서리에 사용감이 있고 일부 페이지에 밑줄이 있습니다.', status: '판매 중', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=80' },
  { id: 3, title: '달러구트 꿈 백화점', author: '이미예', publisher: '팩토리나인', isbn: '9791165341909', category: '소설/시', price: 6500, originalPrice: 13800, condition: '상', description: '깨끗하게 읽은 책입니다.', status: '판매 중', image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=500&q=80' },
  { id: 4, title: '미움받을 용기', author: '기시미 이치로', publisher: '인플루엔셜', isbn: '9788996991342', category: '인문', price: 5500, originalPrice: 14900, condition: '최상', description: '거의 새 책에 가까운 상태입니다.', status: '판매 중', image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=500&q=80' },
  { id: 5, title: '공부머리 독서법', author: '최승필', publisher: '책구루', isbn: '9791189228148', category: '학습/참고서', price: 8000, originalPrice: 16800, condition: '중', description: '몇 페이지에 필기 흔적이 있습니다.', status: '판매 중', image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=500&q=80' },
  { id: 6, title: '식물의 책', author: '이소영', publisher: '책읽는수요일', isbn: '9788962608572', category: '자연과학', price: 5000, originalPrice: 16000, condition: '상', description: '책등에 작은 눌림이 있으나 내부는 깨끗합니다.', status: '판매 중', image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=500&q=80' }
];
const categories = ['전체', '소설/시', '인문', '사회과학', '자연과학', '학습/참고서', '예술/취미', 'IT/컴퓨터'];
const won = n => new Intl.NumberFormat('ko-KR').format(n) + '원';
const readStore = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};

export default function App() {
  const [books, setBooks] = useState(() => readStore('chaekirang-books', seedBooks));
  const [orders, setOrders] = useState(() => readStore('chaekirang-orders', []));
  const [cart, setCart] = useState(() => readStore('chaekirang-cart', []));
  const [page, setPage] = useState('home');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('전체');
  const [sort, setSort] = useState('latest');
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState('');
  const [checkoutMethod, setCheckoutMethod] = useState('현장 결제');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerClass, setBuyerClass] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const [form, setForm] = useState({title:'', author:'', publisher:'', isbn:'', category:'소설/시', price:'', originalPrice:'', condition:'상', description:'', image:''});

  useEffect(() => { localStorage.setItem('chaekirang-books', JSON.stringify(books)); }, [books]);
  useEffect(() => { localStorage.setItem('chaekirang-orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('chaekirang-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 2800); return () => clearTimeout(t); }, [notice]);

  const visibleBooks = useMemo(() => {
    let list = books.filter(b => b.status === '판매 중' &&
      (category === '전체' || b.category === category) &&
      (query.trim() === '' || [b.title,b.author,b.publisher,b.isbn].some(x => (x||'').toLowerCase().includes(query.toLowerCase().trim()))));
    if (sort === 'priceAsc') list.sort((a,b) => a.price-b.price);
    if (sort === 'priceDesc') list.sort((a,b) => b.price-a.price);
    if (sort === 'title') list.sort((a,b) => a.title.localeCompare(b.title, 'ko'));
    return list;
  }, [books, category, query, sort]);
  const cartLines = cart.map(line => ({...line, book: books.find(b => b.id === line.id)})).filter(x => x.book);
  const cartCount = cartLines.reduce((n,x) => n+x.qty, 0);
  const cartTotal = cartLines.reduce((n,x) => n+x.book.price*x.qty, 0);

  const go = p => { setPage(p); setSelected(null); window.scrollTo({top:0,behavior:'smooth'}); };
  const addCart = book => {
    if (!book || book.status !== '판매 중') return;
    setCart(prev => {
      const found = prev.find(x => x.id === book.id);
      if (found) return prev.map(x => x.id === book.id ? {...x, qty: Math.min(x.qty+1,1)} : x);
      return [...prev, {id:book.id, qty:1}];
    });
    setNotice('장바구니에 담았어요.');
  };
  const removeCart = id => setCart(prev => prev.filter(x => x.id !== id));
  const submitOrder = e => {
    e.preventDefault();
    if (!cartLines.length) return setNotice('장바구니가 비어 있어요.');
    if (!buyerName.trim() || !buyerEmail.trim() || !buyerClass.trim()) return setNotice('이름, 학교 이메일, 학급/부서를 입력해 주세요.');
    const newOrder = {
      id: 'BK' + Date.now().toString().slice(-8),
      createdAt: new Date().toLocaleString('ko-KR'),
      buyerName, buyerEmail, buyerClass, method: checkoutMethod,
      pickup: '학교협동조합 지정 수령처',
      total: cartTotal,
      status: checkoutMethod === '온라인 결제' ? '결제 대기' : '현장 결제 대기',
      items: cartLines.map(x => ({id:x.book.id, title:x.book.title, price:x.book.price, qty:x.qty}))
    };
    setOrders(prev => [newOrder, ...prev]);
    setBooks(prev => prev.map(b => cartLines.some(x => x.book.id === b.id) ? {...b, status:'예약됨'} : b));
    setCart([]);
    go('orders');
    setNotice(checkoutMethod === '온라인 결제' ? '주문을 만들었어요. 실제 결제 연동 전이므로 결제는 완료되지 않았습니다.' : '주문이 접수됐어요. 지정 수령처에서 현장 결제해 주세요.');
  };
  const updateOrder = (id, status) => setOrders(prev => prev.map(o => o.id === id ? {...o, status} : o));
  const addBook = e => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim() || Number(form.price) <= 0) return setNotice('책 제목, 저자, 올바른 판매가는 필수입니다.');
    const b = {...form, id: Date.now(), price:Number(form.price), originalPrice:Number(form.originalPrice)||0, status:'판매 중', image:form.image.trim() || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=500&q=80'};
    setBooks(prev => [b, ...prev]);
    setForm({title:'', author:'', publisher:'', isbn:'', category:'소설/시', price:'', originalPrice:'', condition:'상', description:'', image:''});
    setNotice('도서가 등록됐어요. 데모에서는 즉시 판매 목록에 노출됩니다.');
    go('catalog');
  };
  const openBook = b => { setSelected(b); setPage('detail'); window.scrollTo({top:0,behavior:'smooth'}); };

  return <div className="app-shell">
    <header className="topbar">
      <div className="top-inner">
        <button className="brand" onClick={() => go('home')} aria-label="책이랑 홈"><span className="brand-icon"><BookOpen size={27}/></span><span><b>책이랑</b><small>책이 다시, 누군가의 일상이 되다</small></span></button>
        <form className="searchbar" onSubmit={e=>{e.preventDefault();go('catalog')}}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="책 제목, 저자, 출판사를 검색해 보세요"/><button aria-label="검색"><Search size={19}/></button></form>
        <div className="top-actions">
          <button onClick={()=>go('orders')}><UserRound size={17}/><span>주문 내역</span></button>
          <button onClick={()=>go('cart')} className="cart-link"><ShoppingCart size={19}/><span>장바구니</span><i>{cartCount}</i></button>
        </div>
      </div>
      <nav className="nav">
        <div className="nav-inner">
          <button onClick={()=>go('catalog')}><Menu size={17}/> 전체 카테고리</button>
          <button onClick={()=>{setCategory('전체');setSort('latest');go('catalog')}}>중고책 찾기</button>
          <button onClick={()=>{setSort('latest');go('catalog')}}>새로 등록된 책</button>
          <button onClick={()=>{setSort('priceAsc');go('catalog')}}>낮은 가격순</button>
          <button onClick={()=>go('sell')}><Plus size={16}/> 중고책 등록</button>
          <span className="nav-spacer"/>
          <span className="school-label"><GraduationCap size={16}/> 학교 구성원 전용</span>
        </div>
      </nav>
    </header>

    <main>
      {page === 'home' && <Home books={books} openBook={openBook} go={go} setCategory={setCategory} setSort={setSort}/>}
      {page === 'catalog' && <section className="page-wrap">
        <div className="breadcrumbs">홈 <ChevronRight size={13}/> 중고책 찾기</div>
        <div className="catalog-layout">
          <aside className="sidebar"><h3>도서 카테고리</h3>{categories.map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}
            <div className="sidebar-note"><ShieldCheck size={19}/><b>협동조합 검수</b><p>등록된 중고책은 상태 정보를 확인한 뒤 판매합니다.</p></div>
          </aside>
          <div className="catalog-main"><div className="section-heading"><div><h1>{category==='전체'?'중고책 전체 보기':category}</h1><p>총 {visibleBooks.length}권의 책을 찾았어요.</p></div><label className="sort-select"><SlidersHorizontal size={15}/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="latest">최근 등록순</option><option value="priceAsc">낮은 가격순</option><option value="priceDesc">높은 가격순</option><option value="title">제목순</option></select></label></div>
            {query && <div className="query-pill">검색어: “{query}” <button onClick={()=>setQuery('')}><X size={13}/></button></div>}
            <BookGrid books={visibleBooks} openBook={openBook}/>{visibleBooks.length===0&&<Empty title="검색 결과가 없어요" desc="검색어를 바꾸거나 다른 카테고리를 선택해 보세요."/>}
          </div>
        </div>
      </section>}
      {page === 'detail' && selected && <section className="page-wrap">
        <div className="breadcrumbs"><button onClick={()=>go('home')}>홈</button><ChevronRight size={13}/><button onClick={()=>go('catalog')}>중고책 찾기</button><ChevronRight size={13}/>{selected.title}</div>
        <div className="detail-card"><div className="detail-image-wrap"><img className="detail-image" src={selected.image} alt={selected.title}/><span className="condition-badge">{selected.condition} 등급</span></div>
          <div className="detail-info"><div className="eyebrow">{selected.category} · 중고 도서</div><h1>{selected.title}</h1><p className="detail-author">{selected.author} · {selected.publisher || '출판사 미입력'} · ISBN {selected.isbn || '미입력'}</p>
            <div className="price-line"><strong>{won(selected.price)}</strong>{selected.originalPrice>0&&<><del>{won(selected.originalPrice)}</del><span className="discount">{Math.max(0,Math.round((1-selected.price/selected.originalPrice)*100))}% 저렴</span></>}</div>
            <div className="info-box"><div><span>책 상태</span><b>{selected.condition}</b></div><div><span>판매자</span><b>책이랑 협동조합</b></div><div><span>수령 방법</span><b>학교 내 지정 장소에서 직접 수령</b></div><div><span>재고 상태</span><b>{selected.status}</b></div></div>
            <div className="description"><h3>책 상태 설명</h3><p>{selected.description || '상태 설명이 등록되지 않았습니다.'}</p></div>
            <div className="detail-buttons"><button className="btn-secondary" onClick={()=>addCart(selected)} disabled={selected.status!=='판매 중'}><ShoppingCart size={17}/> 장바구니 담기</button><button className="btn-primary" onClick={()=>{addCart(selected);go('cart')}} disabled={selected.status!=='판매 중'}>구매하기 <ArrowRight size={17}/></button></div>
            <p className="notice-line"><ShieldCheck size={15}/> 학교협동조합이 책 상태를 확인하고 직접 판매합니다.</p>
          </div>
        </div>
      </section>}
      {page === 'cart' && <section className="page-wrap narrow"><div className="breadcrumbs">홈 <ChevronRight size={13}/> 장바구니</div><h1 className="page-title">장바구니</h1>
        {!cartLines.length ? <Empty title="장바구니가 비어 있어요" desc="마음에 드는 중고책을 담아 보세요." action="중고책 둘러보기" onAction={()=>go('catalog')}/> :
          <div className="cart-layout"><div className="cart-list">{cartLines.map(line=><div className="cart-row" key={line.id}><img src={line.book.image} alt=""/><div className="cart-book"><b>{line.book.title}</b><span>{line.book.author} · 상태 {line.book.condition}</span><strong>{won(line.book.price)}</strong></div><button className="icon-button danger" onClick={()=>removeCart(line.id)} aria-label="삭제"><Trash2 size={17}/></button></div>)}</div>
          <aside className="summary-card"><h3>주문 요약</h3><div><span>상품 수</span><b>{cartCount}권</b></div><div><span>상품 금액</span><b>{won(cartTotal)}</b></div><div><span>배송비</span><b>0원</b></div><div className="summary-total"><span>총 결제 예정 금액</span><strong>{won(cartTotal)}</strong></div><p>학교 내 지정 수령처에서 직접 수령합니다.</p><button className="btn-primary full" onClick={()=>go('checkout')}>주문하기 <ArrowRight size={16}/></button></aside></div>}
      </section>}
      {page === 'checkout' && <section className="page-wrap narrow"><div className="breadcrumbs">홈 <ChevronRight size={13}/> 장바구니 <ChevronRight size={13}/> 주문하기</div><h1 className="page-title">주문 및 수령 정보</h1>
        {!cartLines.length ? <Empty title="주문할 책이 없어요" desc="먼저 장바구니에 책을 담아 주세요." action="중고책 둘러보기" onAction={()=>go('catalog')}/> :
        <form onSubmit={submitOrder} className="checkout-layout"><div className="checkout-main">
          <div className="form-card"><h2>구매자 정보</h2><label>이름 *<input required value={buyerName} onChange={e=>setBuyerName(e.target.value)} placeholder="학교에서 확인 가능한 이름"/></label><label>학교 이메일 *<input required type="email" value={buyerEmail} onChange={e=>setBuyerEmail(e.target.value)} placeholder="name@school.ac.kr"/></label><label>학급 / 부서 *<input required value={buyerClass} onChange={e=>setBuyerClass(e.target.value)} placeholder="예: 2학년 3반"/></label></div>
          <div className="form-card"><h2>결제 방식</h2><label className={`payment-option ${checkoutMethod==='현장 결제'?'chosen':''}`}><input type="radio" name="payment" checked={checkoutMethod==='현장 결제'} onChange={()=>setCheckoutMethod('현장 결제')}/><span><b>학교에서 현장 결제</b><small>주문 후 지정 수령처에서 결제하고 책을 받아요.</small></span></label><label className={`payment-option ${checkoutMethod==='온라인 결제'?'chosen':''}`}><input type="radio" name="payment" checked={checkoutMethod==='온라인 결제'} onChange={()=>setCheckoutMethod('온라인 결제')}/><span><b>온라인 결제 (데모)</b><small>결제 주문 흐름만 확인합니다. 실제 결제는 연결되어 있지 않아요.</small></span></label></div>
          <div className="form-card"><h2>수령 방법</h2><div className="pickup-info"><PackageCheck size={22}/><div><b>학교 내 지정 수령처</b><p>택배 배송은 제공하지 않습니다. 주문 확인 후 협동조합의 안내에 따라 수령해 주세요.</p></div></div></div>
        </div><aside className="summary-card"><h3>주문 상품</h3>{cartLines.map(x=><div className="summary-product" key={x.id}><span>{x.book.title} × {x.qty}</span><b>{won(x.book.price*x.qty)}</b></div>)}<div className="summary-total"><span>총 금액</span><strong>{won(cartTotal)}</strong></div><button className="btn-primary full" type="submit">주문 접수하기 <ArrowRight size={16}/></button><p className="small-muted">쿠폰·마일리지 없이 상품 금액만 계산합니다.</p></aside></form>}
      </section>}
      {page === 'orders' && <section className="page-wrap narrow"><div className="breadcrumbs">홈 <ChevronRight size={13}/> 주문 내역</div><h1 className="page-title">주문 / 수령 조회</h1><p className="page-subtitle">이 브라우저에 저장된 데모 주문 내역입니다.</p>
        {orders.length===0?<Empty title="아직 주문 내역이 없어요" desc="책을 둘러보고 첫 주문을 해 보세요." action="중고책 둘러보기" onAction={()=>go('catalog')}/>:<div className="orders-list">{orders.map(o=><article className="order-card" key={o.id}><div className="order-head"><div><span>{o.createdAt}</span><b>주문번호 {o.id}</b></div><span className={`status-chip ${o.status.includes('완료')?'success':''}`}>{o.status}</span></div><div className="order-items">{o.items.map((it,i)=><div key={i}><BookMarked size={18}/><span>{it.title} <small>× {it.qty}</small></span><b>{won(it.price*it.qty)}</b></div>)}</div><div className="order-foot"><span>수령: {o.pickup} · 결제: {o.method}</span><b>총 {won(o.total)}</b></div></article>)}</div>}
      </section>}
      {page === 'sell' && <section className="page-wrap narrow"><div className="breadcrumbs">홈 <ChevronRight size={13}/> 도서 관리</div><div className="admin-title"><div><h1 className="page-title">중고책 등록</h1><p className="page-subtitle">협동조합이 직접 검수하고 판매할 도서를 등록합니다.</p></div><span className="admin-tag"><Store size={15}/> 운영 데모</span></div>
        <form className="form-card book-form" onSubmit={addBook}><div className="form-grid"><label>책 제목 *<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="도서명"/></label><label>저자 *<input required value={form.author} onChange={e=>setForm({...form,author:e.target.value})} placeholder="저자명"/></label><label>출판사<input value={form.publisher} onChange={e=>setForm({...form,publisher:e.target.value})} placeholder="출판사"/></label><label>ISBN<input value={form.isbn} onChange={e=>setForm({...form,isbn:e.target.value})} placeholder="ISBN-13"/></label><label>카테고리<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.filter(c=>c!=='전체').map(c=><option key={c}>{c}</option>)}</select></label><label>책 상태<select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})}><option>최상</option><option>상</option><option>중</option></select></label><label>중고 판매가 (원) *<input required type="number" min="1" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="7000"/></label><label>새 책 정가 (원)<input type="number" min="0" value={form.originalPrice} onChange={e=>setForm({...form,originalPrice:e.target.value})} placeholder="15000"/></label></div><label>표지 이미지 URL (선택)<input type="url" value={form.image} onChange={e=>setForm({...form,image:e.target.value})} placeholder="https://..."/></label><label>상태 설명<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="필기, 밑줄, 훼손 등 상태를 자세히 입력하세요."/></label><div className="form-note"><ShieldCheck size={18}/><span>운영 전에는 검수 후 승인된 책만 판매되도록 실제 관리자 승인 절차를 추가하세요. 이 데모는 등록 즉시 판매 목록에 표시됩니다.</span></div><button className="btn-primary" type="submit"><Plus size={17}/> 도서 등록하기</button></form>
      </section>}
      {page === 'admin' && <section className="page-wrap"><div className="breadcrumbs">홈 <ChevronRight size={13}/> 관리자</div><div className="admin-title"><div><h1 className="page-title">협동조합 운영 관리</h1><p className="page-subtitle">상품과 주문의 상태를 확인하고 관리합니다.</p></div><span className="admin-tag"><ShieldCheck size={15}/> 데모 관리자</span></div>
        <div className="stats-grid"><Stat icon={<BookOpen/>} label="등록 도서" value={`${books.length}권`}/><Stat icon={<PackageCheck/>} label="판매 가능" value={`${books.filter(b=>b.status==='판매 중').length}권`}/><Stat icon={<ClipboardList/>} label="전체 주문" value={`${orders.length}건`}/><Stat icon={<CheckCircle2/>} label="수령 완료" value={`${orders.filter(o=>o.status==='수령 완료').length}건`}/></div>
        <div className="admin-panel"><div className="panel-heading"><h2>도서 목록</h2><button className="btn-secondary small" onClick={()=>go('sell')}><Plus size={15}/> 책 등록</button></div><div className="table-wrap"><table><thead><tr><th>도서</th><th>판매가</th><th>상태</th><th>관리</th></tr></thead><tbody>{books.map(b=><tr key={b.id}><td><div className="table-book"><img src={b.image} alt=""/><span><b>{b.title}</b><small>{b.author}</small></span></div></td><td>{won(b.price)}</td><td><span className="status-chip">{b.status}</span></td><td><button className="text-action" onClick={()=>setBooks(prev=>prev.map(x=>x.id===b.id?{...x,status:x.status==='판매 중'?'판매 중지':'판매 중'}:x))}>{b.status==='판매 중'?'판매 중지':'판매 재개'}</button></td></tr>)}</tbody></table></div></div>
        <div className="admin-panel"><div className="panel-heading"><h2>주문 관리</h2></div>{orders.length===0?<p className="empty-inline">주문이 없습니다.</p>:<div className="table-wrap"><table><thead><tr><th>주문번호 / 구매자</th><th>금액</th><th>결제</th><th>주문 상태</th><th>변경</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td><b>{o.id}</b><small className="table-sub">{o.buyerName} · {o.buyerClass}</small></td><td>{won(o.total)}</td><td>{o.method}</td><td><span className="status-chip">{o.status}</span></td><td><select className="status-select" value={o.status} onChange={e=>updateOrder(o.id,e.target.value)}><option>결제 대기</option><option>현장 결제 대기</option><option>결제 완료</option><option>수령 준비 중</option><option>수령 완료</option><option>취소</option></select></td></tr>)}</tbody></table></div>}</div>
      </section>}
    </main>

    <footer className="footer"><div className="footer-inner"><div className="footer-brand"><BookOpen size={23}/><b>책이랑</b></div><p>학교협동조합 온라인 중고책 서점</p><p className="footer-note">이 사이트는 기능 검토용 데모입니다. 주문 데이터는 현재 사용 중인 브라우저에 저장되며 실제 서버로 전송되지 않습니다. 온라인 결제·회원 인증·관리자 권한은 실제 연동 전입니다.</p><div className="footer-links"><button onClick={()=>go('admin')}><ShieldCheck size={15}/> 운영 관리 데모</button><button onClick={()=>go('sell')}><Plus size={15}/> 중고책 등록</button></div><small>© 책이랑 · 학교협동조합</small></div></footer>
    {notice&&<div className="toast"><CheckCircle2 size={18}/>{notice}<button onClick={()=>setNotice('')} aria-label="닫기"><X size={16}/></button></div>}
    <div className="mobile-nav"><button onClick={()=>go('home')}><BookOpen size={19}/>홈</button><button onClick={()=>go('catalog')}><Search size={19}/>책 찾기</button><button onClick={()=>go('sell')}><Plus size={19}/>책 등록</button><button onClick={()=>go('cart')}><ShoppingCart size={19}/>장바구니 {cartCount>0&&<i>{cartCount}</i>}</button></div>
  </div>;
}

function Home({books,openBook,go,setCategory,setSort}) {
  const fresh = [...books].filter(b=>b.status==='판매 중').reverse().slice(0,6);
  return <><section className="hero"><div className="hero-bg"/><div className="hero-content"><span className="hero-kicker"><GraduationCap size={16}/> 학교협동조합 중고책 서점</span><h1>다시 읽는 책,<br/>더 큰 가치를 만듭니다.</h1><p>책장 속 잠자고 있는 책이<br/>누군가에게는 소중한 이야기가 됩니다.</p><form className="hero-search" onSubmit={e=>{e.preventDefault();go('catalog')}}><Search size={19}/><input id="hero-search" placeholder="책 제목, 저자, 출판사를 검색해 보세요" onChange={e=>document.querySelector('.searchbar input') && (document.querySelector('.searchbar input').value=e.target.value)}/><button>책 찾기</button></form><div className="hero-points"><span><ShieldCheck size={15}/> 협동조합 검수</span><span><PackageCheck size={15}/> 학교 내 직접 수령</span><span><Heart size={15}/> 책의 재사용</span></div></div><div className="hero-art"><div className="book-stack"><div className="stack-book blue">다시 읽는 이야기</div><div className="stack-book cream">책이랑</div><div className="stack-book orange">새로운 주인을 만나다</div><div className="stack-book green">오늘의 한 페이지</div></div><div className="hero-circle">READ<br/><b>AGAIN</b></div></div></section>
    <section className="category-strip">{categories.slice(1).map((c,i)=><button key={c} onClick={()=>{setCategory(c);go('catalog')}}><span className={`category-icon c${i}`}><BookOpen size={21}/></span><b>{c}</b></button>)}</section>
    <section className="page-wrap home-section"><div className="section-heading"><div><span className="eyebrow">FRESH FINDS</span><h2>새로 등록된 중고책</h2><p>새 주인을 기다리는 책을 만나 보세요.</p></div><button className="more-link" onClick={()=>{setSort('latest');go('catalog')}}>전체 보기 <ChevronRight size={17}/></button></div><BookGrid books={fresh} openBook={openBook}/></section>
    <section className="how-section"><div className="page-wrap"><div className="section-heading centered"><div><span className="eyebrow">HOW IT WORKS</span><h2>책이랑 이용 방법</h2><p>쉽고 안전하게 중고책을 나누는 네 단계</p></div></div><div className="steps-grid"><Step n="01" icon={<Search/>} title="책을 찾아요" desc="제목이나 저자로 원하는 책을 검색해요."/><Step n="02" icon={<BookMarked/>} title="상태를 확인해요" desc="실제 책의 상태와 판매가를 확인해요."/><Step n="03" icon={<ShoppingCart/>} title="주문해요" desc="장바구니에 담고 결제 방식을 선택해요."/><Step n="04" icon={<PackageCheck/>} title="학교에서 받아요" desc="안내받은 학교 내 수령처에서 책을 받아요."/></div></div></section>
    <section className="cta-wrap"><div className="cta"><div><span>YOUR BOOK, YOUR STORY</span><h2>책장 속 책에 새 기회를 주세요.</h2><p>협동조합과 함께 책의 가치를 이어 가요.</p></div><button onClick={()=>go('sell')}>중고책 등록하기 <ArrowRight size={17}/></button></div></section>
  </>;
}
function BookGrid({books,openBook}) {
  return <div className="book-grid">{books.map((b,i)=><button className="book-card" key={b.id} onClick={()=>openBook(b)}><div className="book-cover"><img src={b.image} alt={`${b.title} 표지`} loading="lazy"/><span className="used-tag">중고</span><span className="cover-hover">자세히 보기 <ArrowRight size={15}/></span></div><div className="book-meta"><span className="book-category">{b.category}</span><b className="book-title">{b.title}</b><span className="book-author">{b.author}</span><div className="book-price">{won(b.price)} {b.originalPrice>0&&<del>{won(b.originalPrice)}</del>}</div><span className={`condition condition-${b.condition}`}>{b.condition} 상태</span></div></button>)}</div>;
}
function Empty({title,desc,action,onAction}) { return <div className="empty-state"><span><BookOpen size={29}/></span><h3>{title}</h3><p>{desc}</p>{action&&<button className="btn-primary" onClick={onAction}>{action}</button>}</div>; }
function Step({n,icon,title,desc}) { return <div className="step-card"><span className="step-number">{n}</span><div className="step-icon">{icon}</div><h3>{title}</h3><p>{desc}</p></div>; }
function Stat({icon,label,value}) { return <div className="stat-card"><span>{icon}</span><div><small>{label}</small><b>{value}</b></div></div>; }
