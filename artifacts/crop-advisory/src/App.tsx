import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  CircleAlert,
  ClipboardCheck,
  CloudSun,
  Filter,
  Leaf,
  MapPin,
  Send,
  ShieldCheck,
  Sprout,
  Thermometer,
  Wheat,
} from 'lucide-react';
import {
  getListCropsQueryKey,
  useListCrops,
  useSubmitAdvisory,
} from '@workspace/api-client-react';
import type { AdvisoryRequestInput, AdvisoryRequestReceipt, Crop, CropCategory, SoilType } from '@workspace/api-client-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

const categories: CropCategory[] = ['Cereals', 'Pulses', 'Cash Crops', 'Fruits', 'Vegetables', 'Oilseeds'];
const soils: SoilType[] = ['Clay', 'Sandy', 'Loamy', 'Peaty', 'Chalky', 'Silty'];

function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return (
    <div className="site-shell" data-testid="layout-app-shell">
      <header className="topbar" data-testid="layout-site-header">
        <div className="topbar-inner">
          <Link href="/" className="brand" data-testid="link-home-brand" aria-label="Fieldnote home">
            <span className="brand-mark"><Sprout size={21} strokeWidth={1.8} /></span>
            <span>fieldnote</span>
          </Link>
          <nav className="nav-links" aria-label="Main navigation">
            <Link href="/crops" className={`nav-link ${location === '/crops' ? 'active' : ''}`} data-testid="link-crop-catalog">Crop catalog</Link>
            <Link href="/advise" className={`nav-link ${location === '/advise' ? 'active' : ''}`} data-testid="link-field-report">Field report</Link>
          </nav>
          <div className="mobile-menu">
            <Link href="/crops" className="nav-link" data-testid="link-crop-catalog-mobile">Crops</Link>
            <Link href="/advise" className="nav-cta" data-testid="link-field-report-mobile">Report an issue <ArrowRight size={14} /></Link>
          </div>
          <Link href="/advise" className="nav-cta desktop-cta" data-testid="link-report-issue">
            Report a field issue <ArrowRight size={14} />
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <div className="page-wrap footer-inner">
          <Link href="/" className="brand" data-testid="link-footer-brand">
            <span className="brand-mark"><Sprout size={18} /></span><span>fieldnote</span>
          </Link>
          <span data-testid="text-footer-promise">Useful growing information, grounded in your field.</span>
          <div className="footer-links">
            <Link href="/crops" data-testid="link-footer-crops">Browse crops</Link>
            <Link href="/advise" data-testid="link-footer-report">Share a field report</Link>
          </div>
        </div>
      </footer>
      <div className="mobile-bottom-bar">
        <Link href="/crops" data-testid="link-bottom-crops">Browse crops</Link>
        <Link href="/advise" data-testid="link-bottom-report">Report issue</Link>
      </div>
    </div>
  );
}

function FieldIllustration() {
  return (
    <div className="hero-art" aria-label="Illustration of a young crop growing across cultivated fields" data-testid="illustration-field">
      <div className="field-visual">
        <div className="field-sun" />
        <div className="field-horizon" />
        <div className="field-row" />
        <svg className="plant-illustration" viewBox="0 0 240 340" fill="none" aria-hidden="true">
          <path d="M119 335C121 268 117 218 121 152C122 124 126 100 130 78" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          <path d="M122 215C83 198 56 174 44 142C77 145 107 163 123 188" fill="#9DB277" stroke="#294F34" strokeWidth="5" strokeLinejoin="round" />
          <path d="M123 169C155 139 186 126 218 129C200 158 169 177 123 184" fill="#AFC284" stroke="#294F34" strokeWidth="5" strokeLinejoin="round" />
          <path d="M127 122C97 103 83 79 82 52C109 64 127 86 132 111" fill="#BBCB8A" stroke="#294F34" strokeWidth="5" strokeLinejoin="round" />
          <path d="M132 90C153 67 175 59 201 63C188 86 168 101 134 105" fill="#9DB277" stroke="#294F34" strokeWidth="5" strokeLinejoin="round" />
          <path d="M130 79C121 62 119 42 125 20C138 38 140 57 134 78" fill="#D4BC72" stroke="#294F34" strokeWidth="5" strokeLinejoin="round" />
          <path d="M48 144C73 161 92 178 111 202M214 131C185 146 157 162 130 178M84 55C103 73 116 91 126 117M198 66C177 79 157 91 136 103" stroke="#52704A" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <div className="visual-note" data-testid="text-illustration-note">
        <span className="note-stamp"><Wheat size={18} /></span>
        <span><span className="note-label">A little clarity</span><span className="note-copy">for every growing season</span></span>
      </div>
      <span className="visual-index">FIELD NOTES / 01</span>
    </div>
  );
}

function CropCard({ crop, index = 0 }: { crop: Crop; index?: number }) {
  return (
    <article className="crop-card" style={{ animationDelay: `${index * 70}ms` }} data-testid={`card-crop-${crop.id}`}>
      <div className="crop-card-top">
        <span className="crop-symbol"><Wheat size={21} strokeWidth={1.7} /></span>
        <span className="crop-category" data-testid={`text-crop-category-${crop.id}`}>{crop.category}</span>
      </div>
      <h3 className="crop-name" data-testid={`text-crop-name-${crop.id}`}>{crop.name}</h3>
      <p className="crop-description" data-testid={`text-crop-description-${crop.id}`}>
        {crop.description || 'A dependable option for the right field and season.'}
      </p>
      <div className="crop-meta">
        <span className="crop-temperature" data-testid={`text-crop-temperature-${crop.id}`}><Thermometer size={14} /> {crop.optimalTemperature}</span>
        <span className="soil-tags" data-testid={`list-crop-soils-${crop.id}`}>
          {crop.compatibleSoils.slice(0, 2).map((soil) => <span className="soil-tag" key={soil}>{soil}</span>)}
          {crop.compatibleSoils.length > 2 && <span className="soil-tag">+{crop.compatibleSoils.length - 2}</span>}
        </span>
      </div>
    </article>
  );
}

function CropLoadingGrid() {
  return (
    <div className="crop-grid" aria-label="Loading crops" data-testid="loading-crops">
      {[0, 1, 2].map((item) => (
        <div className="skeleton-card" key={item} aria-hidden="true">
          <div className="skeleton skeleton-line" style={{ width: 44, height: 44, borderRadius: 14, marginBottom: 25 }} />
          <div className="skeleton skeleton-line" style={{ width: '58%', height: 22, marginBottom: 17 }} />
          <div className="skeleton skeleton-line" style={{ width: '94%' }} />
          <div className="skeleton skeleton-line" style={{ width: '74%' }} />
          <div className="skeleton skeleton-line" style={{ width: '48%', marginTop: 35 }} />
        </div>
      ))}
    </div>
  );
}

function CropError({ retry }: { retry: () => void }) {
  return (
    <div className="error-panel" role="alert" data-testid="error-crops">
      <span><strong>We couldn't load the crop list.</strong><p>Check your connection and try once more.</p></span>
      <button className="button-secondary" onClick={retry} data-testid="button-retry-crops">Try again</button>
    </div>
  );
}

function CropEmpty({ filtered = false }: { filtered?: boolean }) {
  return (
    <div className="empty-state" data-testid="empty-crops">
      <span className="empty-icon"><Sprout size={23} /></span>
      <h3>{filtered ? 'No crops match those filters' : 'The field is quiet for now'}</h3>
      <p>{filtered ? 'Try another category or soil type to see more options.' : 'There are no active crops in the catalog yet. Please check back soon.'}</p>
    </div>
  );
}

function HomePage() {
  const cropsQuery = useListCrops();
  const activeCrops = (cropsQuery.data || []).filter((crop) => crop.isActive).slice(0, 3);
  return (
    <>
      <section className="page-wrap hero" data-testid="section-home-introduction">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-line" /> GROUNDED ADVICE FOR GROWING THINGS</span>
          <h1>Good seasons start with <em>good choices.</em></h1>
          <p className="hero-lede">Find crops suited to your soil. Tell us what is happening in your field. Straightforward support, made for the work you do every day.</p>
          <div className="hero-actions">
            <Link href="/crops" className="button-primary" data-testid="button-explore-crops">Explore the crop catalog <ArrowRight size={15} /></Link>
            <Link href="/advise" className="button-secondary" data-testid="button-share-field-issue">Share a field issue <ArrowDownRight size={15} /></Link>
          </div>
          <div className="trust-note" data-testid="text-trust-note">
            <span className="trust-icon"><ShieldCheck size={15} /></span>
            Practical information for real fields and real seasons.
          </div>
        </div>
        <FieldIllustration />
      </section>

      <section className="season-band" data-testid="section-field-principles">
        <div className="season-inner">
          <div className="season-caption"><CloudSun size={19} /><span><strong>Made for the field.</strong> Easy to use, even between rows.</span></div>
          <div className="season-stat"><Leaf size={19} /><span>Crop-fit first<small>Explore by category and soil</small></span></div>
          <div className="season-stat"><MapPin size={19} /><span>Your place matters<small>Share where you are growing</small></span></div>
          <div className="season-stat"><ClipboardCheck size={19} /><span>Plain-language reports<small>Describe what you notice</small></span></div>
        </div>
      </section>

      <section className="page-wrap section" data-testid="section-featured-crops">
        <div className="section-heading">
          <div>
            <span className="eyebrow"><span className="eyebrow-line" /> START WITH THE RIGHT FIT</span>
            <h2 className="section-title">A few crops to<br />get you growing.</h2>
          </div>
          <div className="section-intro">Browse active crop options, compare their growing conditions, and see what could suit the ground you work.</div>
        </div>
        {cropsQuery.isLoading ? <CropLoadingGrid /> :
          cropsQuery.isError ? <CropError retry={() => void cropsQuery.refetch()} /> :
            activeCrops.length ? (
              <>
                <div className="crop-grid" data-testid="list-featured-crops">
                  {activeCrops.map((crop, index) => <CropCard crop={crop} index={index} key={crop.id} />)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 26 }}>
                  <Link href="/crops" className="button-secondary" data-testid="button-view-all-crops">See all active crops <ArrowRight size={14} /></Link>
                </div>
              </>
            ) : <CropEmpty />}
      </section>

      <section className="page-wrap" data-testid="section-report-invitation">
        <div className="callout">
          <div className="callout-copy">
            <span className="eyebrow" style={{ color: '#E4C58D' }}><span className="eyebrow-line" /> WHEN SOMETHING DOESN'T LOOK RIGHT</span>
            <h2>Tell us what you're seeing.</h2>
            <p>A clear description of a crop concern is a good first step. Share where and when you noticed it, in your own words.</p>
          </div>
          <Link href="/advise" className="button-secondary" data-testid="button-start-field-report">Start a field report <ArrowRight size={15} /></Link>
        </div>
      </section>
    </>
  );
}

function CatalogPage() {
  const [category, setCategory] = useState('');
  const [soil, setSoil] = useState('');
  const params = useMemo(() => ({
    ...(category ? { category: category as CropCategory } : {}),
    ...(soil ? { soil: soil as SoilType } : {}),
  }), [category, soil]);
  const cropsQuery = useListCrops(params);
  const filteredCrops = (cropsQuery.data || []).filter((crop) => crop.isActive);
  return (
    <>
      <header className="page-header" data-testid="section-catalog-header">
        <div className="page-wrap page-header-row">
          <div>
            <span className="eyebrow"><span className="eyebrow-line" /> THE CROP CATALOG</span>
            <h1 className="page-title">Find a good fit.</h1>
            <p className="page-lede">Explore active crop options by category or soil. A useful place to start planning your next growing season.</p>
          </div>
          {!cropsQuery.isLoading && !cropsQuery.isError && (
            <div className="catalog-count" data-testid="text-catalog-count">{filteredCrops.length} {filteredCrops.length === 1 ? 'crop' : 'crops'} shown</div>
          )}
        </div>
      </header>
      <section className="page-wrap catalog-layout" data-testid="section-crop-catalog">
        <div className="filter-panel">
          <span className="filter-label"><Filter size={15} /> Narrow your search</span>
          <div className="filter-controls">
            <label>
              <span className="sr-only">Filter by crop category</span>
              <select className="filter-select" value={category} onChange={(event) => setCategory(event.target.value)} data-testid="select-filter-category">
                <option value="">All categories</option>
                {categories.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by compatible soil</span>
              <select className="filter-select" value={soil} onChange={(event) => setSoil(event.target.value)} data-testid="select-filter-soil">
                <option value="">All soil types</option>
                {soils.map((item) => <option value={item} key={item}>{item} soil</option>)}
              </select>
            </label>
            {(category || soil) && (
              <button className="button-secondary" style={{ padding: '9px 13px', fontSize: 11 }} onClick={() => { setCategory(''); setSoil(''); }} data-testid="button-clear-filters">Clear filters</button>
            )}
          </div>
        </div>
        {cropsQuery.isLoading ? <CropLoadingGrid /> :
          cropsQuery.isError ? <CropError retry={() => void cropsQuery.refetch()} /> :
            filteredCrops.length ? (
              <div className="crop-grid" data-testid="list-catalog-crops">
                {filteredCrops.map((crop, index) => <CropCard crop={crop} index={index} key={crop.id} />)}
              </div>
            ) : <CropEmpty filtered={Boolean(category || soil)} />}
      </section>
    </>
  );
}

const todayLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

function receiptDate(receipt: AdvisoryRequestReceipt) {
  const date = new Date(receipt.createdAt);
  return Number.isNaN(date.getTime()) ? 'Just now' : new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function AdvisoryPage() {
  const queryClient = useQueryClient();
  const submitAdvisory = useSubmitAdvisory({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListCropsQueryKey() });
      },
    },
  });
  const [receipt, setReceipt] = useState<AdvisoryRequestReceipt | null>(null);
  const [formError, setFormError] = useState('');
  const [values, setValues] = useState<AdvisoryRequestInput>({
    farmerName: '',
    phone: '',
    location: '',
    dateObserved: todayLocal(),
    farmSizeAcres: 1,
    issueDescription: '',
  });
  const updateField = <K extends keyof AdvisoryRequestInput>(key: K, value: AdvisoryRequestInput[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    if (values.farmerName.trim().length < 2) {
      setFormError('Please enter your name so the report can be identified.');
      return;
    }
    if (values.phone.trim().length < 10) {
      setFormError('Enter a phone number with at least 10 characters.');
      return;
    }
    if (values.location.trim().length < 2) {
      setFormError('Please enter a village, district, or nearby town.');
      return;
    }
    if (!values.dateObserved) {
      setFormError('Please add the date you first noticed the issue.');
      return;
    }
    if (!Number.isFinite(values.farmSizeAcres) || values.farmSizeAcres <= 0) {
      setFormError('Enter a farm size greater than zero.');
      return;
    }
    if (values.issueDescription.trim().length < 10) {
      setFormError('Please describe what you have noticed in at least 10 characters.');
      return;
    }
    submitAdvisory.mutate({ data: { ...values, farmerName: values.farmerName.trim(), phone: values.phone.trim(), location: values.location.trim(), issueDescription: values.issueDescription.trim() } }, {
      onSuccess: (result) => setReceipt(result),
      onError: () => setFormError('Your report could not be sent just now. Please try again.'),
    });
  };
  const startAnother = () => {
    setReceipt(null);
    setFormError('');
    setValues({ farmerName: '', phone: '', location: '', dateObserved: todayLocal(), farmSizeAcres: 1, issueDescription: '' });
  };

  return (
    <>
      <header className="page-header" data-testid="section-advice-header">
        <div className="page-wrap">
          <span className="eyebrow"><span className="eyebrow-line" /> A FIELD REPORT, IN YOUR WORDS</span>
          <h1 className="page-title">What are you seeing?</h1>
          <p className="page-lede">A few details help us understand what is happening in your field. You do not need special terms—just tell us what you have noticed.</p>
        </div>
      </header>
      <section className="page-wrap advice-layout" data-testid="section-advisory-form">
        <div>
          <div className="form-intro">
            <span className="eyebrow"><span className="eyebrow-line" /> FIELD ISSUE INTAKE</span>
            <p>Share the basics and a plain-language description. Fields marked required need to be filled in before you send your report.</p>
          </div>
          {receipt ? (
            <div className="success-card" role="status" data-testid="status-advisory-success">
              <span className="success-mark"><Check size={23} /></span>
              <h2>Report received.</h2>
              <p>Your field report has been sent. Keep this reference handy if you need to follow up.</p>
              <div className="receipt-row"><span>Reference</span><span className="receipt-id" data-testid="text-receipt-id">{receipt.id}</span></div>
              <div className="receipt-row"><span>Status</span><strong data-testid="text-receipt-status">{receipt.status}</strong></div>
              <div className="receipt-row"><span>Received</span><span data-testid="text-receipt-date">{receiptDate(receipt)}</span></div>
              <div className="success-actions">
                <button className="button-primary" onClick={startAnother} data-testid="button-submit-another">Send another report <ArrowRight size={14} /></button>
              </div>
            </div>
          ) : (
            <form className="form-card" onSubmit={onSubmit} noValidate data-testid="form-advisory">
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="farmerName">Your name <span>· required</span></label>
                  <input id="farmerName" name="farmerName" autoComplete="name" minLength={2} maxLength={255} required value={values.farmerName} onChange={(event) => updateField('farmerName', event.target.value)} placeholder="Name to use when following up" data-testid="input-farmer-name" />
                </div>
                <div className="field">
                  <label htmlFor="phone">Phone number <span>· required</span></label>
                  <input id="phone" name="phone" autoComplete="tel" type="tel" minLength={10} maxLength={50} required value={values.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="Best number to reach you" data-testid="input-phone" />
                </div>
                <div className="field">
                  <label htmlFor="location">Farm location <span>· required</span></label>
                  <input id="location" name="location" autoComplete="address-level2" minLength={2} maxLength={255} required value={values.location} onChange={(event) => updateField('location', event.target.value)} placeholder="Village, district, or nearest town" data-testid="input-location" />
                </div>
                <div className="field">
                  <label htmlFor="dateObserved">When did you first notice it? <span>· required</span></label>
                  <input id="dateObserved" name="dateObserved" type="date" max={todayLocal()} required value={values.dateObserved} onChange={(event) => updateField('dateObserved', event.target.value)} data-testid="input-date-observed" />
                </div>
                <div className="field">
                  <label htmlFor="farmSizeAcres">Farm size in acres <span>· required</span></label>
                  <input id="farmSizeAcres" name="farmSizeAcres" type="number" min="0.01" step="any" required value={values.farmSizeAcres} onChange={(event) => updateField('farmSizeAcres', Number(event.target.value))} data-testid="input-farm-size" />
                </div>
                <div className="field full">
                  <label htmlFor="issueDescription">What is happening in the field? <span>· required</span></label>
                  <textarea id="issueDescription" name="issueDescription" minLength={10} maxLength={10000} required value={values.issueDescription} onChange={(event) => updateField('issueDescription', event.target.value)} placeholder="Tell us what you see. For example: which crop is affected, what changed, and how much of the field looks this way." data-testid="input-issue-description" />
                </div>
              </div>
              {(formError || submitAdvisory.isError) && (
                <div className="error-panel" role="alert" style={{ marginTop: 18 }} data-testid="error-advisory-submit">
                  <span><strong><CircleAlert size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />We couldn't send this report.</strong><p>{formError || 'Please check your connection and try again.'}</p></span>
                  <button type="button" className="button-secondary" onClick={() => { setFormError(''); submitAdvisory.reset(); }} data-testid="button-dismiss-submit-error">Dismiss</button>
                </div>
              )}
              <div className="form-bottom">
                <span className="privacy-note"><ShieldCheck size={15} /> Your details are used to understand and respond to this field report.</span>
                <button className="button-primary submit-button" type="submit" disabled={submitAdvisory.isPending} data-testid="button-submit-advisory">
                  {submitAdvisory.isPending ? <>Sending report…</> : <>Send field report <Send size={14} /></>}
                </button>
              </div>
            </form>
          )}
        </div>
        <aside className="aside-stack" aria-label="Tips for your field report" data-testid="aside-report-guidance">
          <div className="aside-note dark">
            <div className="aside-number">01</div>
            <h3>Use the words you know.</h3>
            <p>There is no need to identify the cause. Describe what looks different, where it appears, and when it began.</p>
          </div>
          <div className="aside-note">
            <div className="aside-number">02</div>
            <h3>Small details help.</h3>
            <p>Mention the crop, the area affected, recent weather, or any changes you have observed if you know them.</p>
          </div>
          <div className="aside-note">
            <div className="aside-number">03</div>
            <h3>Keep it simple.</h3>
            <p>This form is designed to work outdoors. A short, clear description is a good place to begin.</p>
          </div>
        </aside>
      </section>
    </>
  );
}

function NotFoundPage() {
  return (
    <section className="page-wrap" style={{ minHeight: '55vh', display: 'grid', placeItems: 'center', textAlign: 'center' }} data-testid="page-not-found">
      <div><span className="empty-icon"><Sprout size={23} /></span><h1 className="section-title">This path has gone quiet.</h1><p className="page-lede" style={{ margin: '14px auto 22px' }}>That page is not part of the field guide.</p><Link href="/" className="button-primary" data-testid="button-return-home">Back to Fieldnote <ArrowRight size={14} /></Link></div>
    </section>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return (
    <AppShell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/crops" component={CatalogPage} />
          <Route path="/advise" component={AdvisoryPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </RoutedErrorBoundary>
    </AppShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;