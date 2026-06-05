import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings, getProfile, updateProfile } from '../services/api';
import toast from 'react-hot-toast';
import { Save, Link2, User, Plus, X } from 'lucide-react';

const arrEq = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);

// Inline add chip — shows input on click
function AddChip({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const submit = () => {
    if (value.trim()) { onAdd(value.trim()); setValue(''); }
    setEditing(false);
  };

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)}
        className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full flex items-center gap-1 border border-blue-200 hover:bg-blue-100 transition-colors">
        <Plus className="w-3 h-3" /> Add
      </button>
    );
  }

  return (
    <input ref={inputRef} type="text" value={value} placeholder={placeholder}
      onChange={e => setValue(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } if (e.key === 'Escape') setEditing(false); }}
      onBlur={submit}
      className="px-2 py-0.5 text-xs rounded-full border border-blue-300 outline-none w-36" />
  );
}

// Skill add chip with category selector
function SkillAddChip({ onAdd }: { onAdd: (category: string, value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState('frontend');
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const submit = () => {
    if (value.trim()) { onAdd(category, value.trim()); setValue(''); }
    setEditing(false);
  };

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)}
        className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full flex items-center gap-1 border border-blue-200 hover:bg-blue-100 transition-colors mt-2">
        <Plus className="w-3 h-3" /> Add Skill
      </button>
    );
  }

  return (
    <div className="flex gap-2 mt-2 items-center">
      <select value={category} onChange={e => setCategory(e.target.value)} className="px-2 py-0.5 text-xs rounded-full border border-blue-300 outline-none">
        <option value="frontend">Frontend</option>
        <option value="backend">Backend</option>
        <option value="database">Database</option>
        <option value="tools">Tools</option>
        <option value="orm">ORM</option>
      </select>
      <input ref={inputRef} type="text" value={value} placeholder="Skill name"
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } if (e.key === 'Escape') setEditing(false); }}
        onBlur={submit}
        className="px-2 py-0.5 text-xs rounded-full border border-blue-300 outline-none w-28" />
    </div>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await getSettings()).data.data,
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await getProfile()).data.data,
  });

  // Profile state
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [experience, setExperience] = useState(1);
  const [locations, setLocations] = useState<string[]>([]);
  const [noticePeriod, setNoticePeriod] = useState('Immediate');
  const [currentSalary, setCurrentSalary] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('7 LPA');
  const [frontendSkills, setFrontendSkills] = useState<string[]>([]);
  const [backendSkills, setBackendSkills] = useState<string[]>([]);
  const [databaseSkills, setDatabaseSkills] = useState<string[]>([]);
  const [toolsSkills, setToolsSkills] = useState<string[]>([]);
  const [ormSkills, setOrmSkills] = useState<string[]>([]);

  const [hardwareMode, setHardwareMode] = useState(settings?.hardwareMode || 'medium');
  const [autoSearch, setAutoSearch] = useState(settings?.autoSearch ?? true);
  const [minSalary, setMinSalary] = useState(settings?.filters?.minSalary || 7);
  const [maxExperience, setMaxExperience] = useState(settings?.filters?.maxExperience || 3);
  const [minMatchScore, setMinMatchScore] = useState(settings?.filters?.minMatchScore || 75);
  const [linkedinUrl, setLinkedinUrl] = useState(settings?.platforms?.linkedin?.profileUrl || '');
  const [linkedinEmail, setLinkedinEmail] = useState(settings?.platforms?.linkedin?.email || '');
  const [linkedinPass, setLinkedinPass] = useState(settings?.platforms?.linkedin?.password || '');
  const [naukriUrl, setNaukriUrl] = useState(settings?.platforms?.naukri?.profileUrl || '');
  const [naukriEmail, setNaukriEmail] = useState(settings?.platforms?.naukri?.email || '');
  const [naukriPass, setNaukriPass] = useState(settings?.platforms?.naukri?.password || '');
  const [indeedUrl, setIndeedUrl] = useState(settings?.platforms?.indeed?.profileUrl || '');
  const [indeedEmail, setIndeedEmail] = useState(settings?.platforms?.indeed?.email || '');
  const [indeedPass, setIndeedPass] = useState(settings?.platforms?.indeed?.password || '');
  const [glassdoorUrl, setGlassdoorUrl] = useState(settings?.platforms?.glassdoor?.profileUrl || '');
  const [glassdoorEmail, setGlassdoorEmail] = useState(settings?.platforms?.glassdoor?.email || '');
  const [glassdoorPass, setGlassdoorPass] = useState(settings?.platforms?.glassdoor?.password || '');
  const [instahyreUrl, setInstahyreUrl] = useState(settings?.platforms?.instahyre?.profileUrl || '');
  const [instahyreEmail, setInstahyreEmail] = useState(settings?.platforms?.instahyre?.email || '');
  const [instahyrePass, setInstahyrePass] = useState(settings?.platforms?.instahyre?.password || '');
  const [founditUrl, setFounditUrl] = useState(settings?.platforms?.foundit?.profileUrl || '');
  const [founditEmail, setFounditEmail] = useState(settings?.platforms?.foundit?.email || '');
  const [founditPass, setFounditPass] = useState(settings?.platforms?.foundit?.password || '');
  const [wellfoundUrl, setWellfoundUrl] = useState(settings?.platforms?.wellfound?.profileUrl || '');
  const [wellfoundEmail, setWellfoundEmail] = useState(settings?.platforms?.wellfound?.email || '');
  const [wellfoundPass, setWellfoundPass] = useState(settings?.platforms?.wellfound?.password || '');

  useEffect(() => {
    // profile = user object from API, nested .profile has the actual data
    const p = profile?.profile;
    if (!p) return;
    setTargetRoles(p.targetRoles?.length ? p.targetRoles : []);
    setExperience(p.experience || 1);
    setLocations(p.locations?.length ? p.locations : (p.location ? [p.location] : ['India']));
    setNoticePeriod(p.noticePeriod || 'Immediate');
    setCurrentSalary(p.currentSalary || '');
    setExpectedSalary(p.expectedSalary || '7 LPA');
    setFrontendSkills(p.skills?.frontend || []);
    setBackendSkills(p.skills?.backend || []);
    setDatabaseSkills(p.skills?.database || []);
    setToolsSkills(p.skills?.tools || []);
    setOrmSkills(p.skills?.orm || []);
  }, [profile]);

  useEffect(() => {
    if (settings) {
      setHardwareMode(settings.hardwareMode || 'medium');
      setAutoSearch(settings.autoSearch ?? true);
      setMinSalary(settings.filters?.minSalary || 7);
      setMaxExperience(settings.filters?.maxExperience || 3);
      setMinMatchScore(settings.filters?.minMatchScore || 75);
      setLinkedinUrl(settings.platforms?.linkedin?.profileUrl || '');
      setLinkedinEmail(settings.platforms?.linkedin?.email || '');
      setLinkedinPass(settings.platforms?.linkedin?.password || '');
      setNaukriUrl(settings.platforms?.naukri?.profileUrl || '');
      setNaukriEmail(settings.platforms?.naukri?.email || '');
      setNaukriPass(settings.platforms?.naukri?.password || '');
      setIndeedUrl(settings.platforms?.indeed?.profileUrl || '');
      setIndeedEmail(settings.platforms?.indeed?.email || '');
      setIndeedPass(settings.platforms?.indeed?.password || '');
      setGlassdoorUrl(settings.platforms?.glassdoor?.profileUrl || '');
      setGlassdoorEmail(settings.platforms?.glassdoor?.email || '');
      setGlassdoorPass(settings.platforms?.glassdoor?.password || '');
      setInstahyreUrl(settings.platforms?.instahyre?.profileUrl || '');
      setInstahyreEmail(settings.platforms?.instahyre?.email || '');
      setInstahyrePass(settings.platforms?.instahyre?.password || '');
      setFounditUrl(settings.platforms?.foundit?.profileUrl || '');
      setFounditEmail(settings.platforms?.foundit?.email || '');
      setFounditPass(settings.platforms?.foundit?.password || '');
      setWellfoundUrl(settings.platforms?.wellfound?.profileUrl || '');
      setWellfoundEmail(settings.platforms?.wellfound?.email || '');
      setWellfoundPass(settings.platforms?.wellfound?.password || '');
    }
  }, [settings]);

  // Dirty tracking
  const origProfile = useRef<any>(null);
  const origSettings = useRef<any>(null);

  useEffect(() => {
    if (profile?.profile) {
      origProfile.current = {
        targetRoles: profile.profile.targetRoles || [],
        experience: profile.profile.experience || 1,
        locations: profile.profile.locations || (profile.profile.location ? [profile.profile.location] : ['India']),
        noticePeriod: profile.profile.noticePeriod || 'Immediate',
        currentSalary: profile.profile.currentSalary || '',
        expectedSalary: profile.profile.expectedSalary || '7 LPA',
        frontendSkills: profile.profile.skills?.frontend || [],
        backendSkills: profile.profile.skills?.backend || [],
        databaseSkills: profile.profile.skills?.database || [],
        toolsSkills: profile.profile.skills?.tools || [],
        ormSkills: profile.profile.skills?.orm || [],
      };
    }
  }, [profile]);

  useEffect(() => {
    if (settings) {
      origSettings.current = {
        hardwareMode: settings.hardwareMode || 'medium',
        autoSearch: settings.autoSearch ?? true,
        minSalary: settings.filters?.minSalary || 7,
        maxExperience: settings.filters?.maxExperience || 3,
        minMatchScore: settings.filters?.minMatchScore || 75,
        linkedinUrl: settings.platforms?.linkedin?.profileUrl || '',
        linkedinEmail: settings.platforms?.linkedin?.email || '',
        linkedinPass: settings.platforms?.linkedin?.password || '',
        naukriUrl: settings.platforms?.naukri?.profileUrl || '',
        naukriEmail: settings.platforms?.naukri?.email || '',
        naukriPass: settings.platforms?.naukri?.password || '',
        indeedUrl: settings.platforms?.indeed?.profileUrl || '',
        indeedEmail: settings.platforms?.indeed?.email || '',
        indeedPass: settings.platforms?.indeed?.password || '',
        glassdoorUrl: settings.platforms?.glassdoor?.profileUrl || '',
        glassdoorEmail: settings.platforms?.glassdoor?.email || '',
        glassdoorPass: settings.platforms?.glassdoor?.password || '',
        instahyreUrl: settings.platforms?.instahyre?.profileUrl || '',
        instahyreEmail: settings.platforms?.instahyre?.email || '',
        instahyrePass: settings.platforms?.instahyre?.password || '',
        founditUrl: settings.platforms?.foundit?.profileUrl || '',
        founditEmail: settings.platforms?.foundit?.email || '',
        founditPass: settings.platforms?.foundit?.password || '',
        wellfoundUrl: settings.platforms?.wellfound?.profileUrl || '',
        wellfoundEmail: settings.platforms?.wellfound?.email || '',
        wellfoundPass: settings.platforms?.wellfound?.password || '',
      };
    }
  }, [settings]);

  const profileDirty = origProfile.current ? (
    !arrEq(targetRoles, origProfile.current.targetRoles) ||
    experience !== origProfile.current.experience ||
    !arrEq(locations, origProfile.current.locations) ||
    noticePeriod !== origProfile.current.noticePeriod ||
    currentSalary !== origProfile.current.currentSalary ||
    expectedSalary !== origProfile.current.expectedSalary ||
    !arrEq(frontendSkills, origProfile.current.frontendSkills) ||
    !arrEq(backendSkills, origProfile.current.backendSkills) ||
    !arrEq(databaseSkills, origProfile.current.databaseSkills) ||
    !arrEq(toolsSkills, origProfile.current.toolsSkills) ||
    !arrEq(ormSkills, origProfile.current.ormSkills)
  ) : false;

  const settingsDirty = origSettings.current ? (
    hardwareMode !== origSettings.current.hardwareMode ||
    autoSearch !== origSettings.current.autoSearch ||
    minSalary !== origSettings.current.minSalary ||
    maxExperience !== origSettings.current.maxExperience ||
    minMatchScore !== origSettings.current.minMatchScore ||
    linkedinUrl !== origSettings.current.linkedinUrl ||
    linkedinEmail !== origSettings.current.linkedinEmail ||
    linkedinPass !== origSettings.current.linkedinPass ||
    naukriUrl !== origSettings.current.naukriUrl ||
    naukriEmail !== origSettings.current.naukriEmail ||
    naukriPass !== origSettings.current.naukriPass ||
    indeedUrl !== origSettings.current.indeedUrl ||
    indeedEmail !== origSettings.current.indeedEmail ||
    indeedPass !== origSettings.current.indeedPass ||
    glassdoorUrl !== origSettings.current.glassdoorUrl ||
    glassdoorEmail !== origSettings.current.glassdoorEmail ||
    glassdoorPass !== origSettings.current.glassdoorPass ||
    instahyreUrl !== origSettings.current.instahyreUrl ||
    instahyreEmail !== origSettings.current.instahyreEmail ||
    instahyrePass !== origSettings.current.instahyrePass ||
    founditUrl !== origSettings.current.founditUrl ||
    founditEmail !== origSettings.current.founditEmail ||
    founditPass !== origSettings.current.founditPass ||
    wellfoundUrl !== origSettings.current.wellfoundUrl ||
    wellfoundEmail !== origSettings.current.wellfoundEmail ||
    wellfoundPass !== origSettings.current.wellfoundPass
  ) : false;

  const profileMut = useMutation({
    mutationFn: () => updateProfile({
      profile: {
        targetRoles, experience, locations, noticePeriod, currentSalary, expectedSalary,
        targetSalary: expectedSalary,
        skills: { frontend: frontendSkills, backend: backendSkills, database: databaseSkills, tools: toolsSkills, orm: ormSkills },
      }
    }),
    onSuccess: () => { toast.success('Profile saved'); queryClient.invalidateQueries({ queryKey: ['profile'] }); },
  });

  const saveMut = useMutation({
    mutationFn: () => updateSettings({
      hardwareMode, autoSearch,
      filters: { minSalary, maxExperience, minMatchScore, locations: ['India'], excludeTitles: ['Lead', 'Principal', 'Architect', 'Manager', 'Staff Engineer'] },
      platforms: {
        linkedin: { profileUrl: linkedinUrl, email: linkedinEmail, password: linkedinPass },
        naukri: { profileUrl: naukriUrl, email: naukriEmail, password: naukriPass },
        indeed: { profileUrl: indeedUrl, email: indeedEmail, password: indeedPass },
        glassdoor: { profileUrl: glassdoorUrl, email: glassdoorEmail, password: glassdoorPass },
        instahyre: { profileUrl: instahyreUrl, email: instahyreEmail, password: instahyrePass },
        foundit: { profileUrl: founditUrl, email: founditEmail, password: founditPass },
        wellfound: { profileUrl: wellfoundUrl, email: wellfoundEmail, password: wellfoundPass },
      },
    }),
    onSuccess: () => { toast.success('Settings saved'); queryClient.invalidateQueries({ queryKey: ['settings'] }); },
  });

  const addSkill = (category: string, value: string) => {
    const setters: Record<string, [string[], (s: string[]) => void]> = {
      frontend: [frontendSkills, setFrontendSkills],
      backend: [backendSkills, setBackendSkills],
      database: [databaseSkills, setDatabaseSkills],
      tools: [toolsSkills, setToolsSkills],
      orm: [ormSkills, setOrmSkills],
    };
    const [arr, setter] = setters[category];
    if (!arr.includes(value)) setter([...arr, value]);
  };

  const removeSkill = (category: string, skill: string) => {
    const setters: Record<string, [string[], (s: string[]) => void]> = {
      frontend: [frontendSkills, setFrontendSkills],
      backend: [backendSkills, setBackendSkills],
      database: [databaseSkills, setDatabaseSkills],
      tools: [toolsSkills, setToolsSkills],
      orm: [ormSkills, setOrmSkills],
    };
    const [arr, setter] = setters[category];
    setter(arr.filter(s => s !== skill));
  };

  if (isLoading || profileLoading) return <div>Loading...</div>;

  // Header with save button helper
  const cardHeader = (icon: React.ReactNode, title: string, dirty: boolean, saving: boolean, onSave: () => void) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      {dirty ? (
        <button onClick={onSave} disabled={saving}
          className="btn-primary flex items-center gap-2 text-sm px-4 py-1.5 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
        </button>
      ) : (
        <span className="text-xs text-gray-400 italic">No changes in {title}</span>
      )}
    </div>
  );

  return (
    <div className="space-y-6 w-full">
      <h2 className="text-2xl font-bold">Settings</h2>

      {/* My Profile */}
      <div className="card space-y-6">
        {cardHeader(<User className="w-5 h-5 text-green-600" />, 'My Profile', profileDirty, profileMut.isPending, () => profileMut.mutate())}
        <p className="text-sm text-gray-500">Your skills and preferences drive job search, matching, and auto-apply.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">Experience (Years)</label>
            <input type="number" value={experience} onChange={e => setExperience(+e.target.value)} className="input" min={0} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Notice Period</label>
            <select value={noticePeriod} onChange={e => setNoticePeriod(e.target.value)} className="input">
              <option>Immediate</option>
              <option>15 Days</option>
              <option>30 Days</option>
              <option>60 Days</option>
              <option>90 Days</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Current Salary</label>
            <input type="text" placeholder="e.g. 5 LPA" value={currentSalary} onChange={e => setCurrentSalary(e.target.value)} className="input" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Expected Salary</label>
            <input type="text" placeholder="e.g. 7 LPA" value={expectedSalary} onChange={e => setExpectedSalary(e.target.value)} className="input" />
          </div>
        </div>

        {/* Locations */}
        <div className="border-t pt-4">
          <label className="text-sm font-medium mb-2 block">📍 Preferred Locations</label>
          <div className="flex flex-wrap gap-2">
            {locations.map(l => (
              <span key={l} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full flex items-center gap-1">
                {l}
                <button onClick={() => setLocations(locations.filter(x => x !== l))}><X className="w-3 h-3" /></button>
              </span>
            ))}
            <AddChip placeholder="City or Country" onAdd={v => { if (!locations.includes(v)) setLocations([...locations, v]); }} />
          </div>
        </div>

        {/* Target Roles */}
        <div className="border-t pt-4">
          <label className="text-sm font-medium mb-2 block">🎯 Target Roles</label>
          <div className="flex flex-wrap gap-2">
            {targetRoles.map(r => (
              <span key={r} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full flex items-center gap-1">
                {r}
                <button onClick={() => setTargetRoles(targetRoles.filter(x => x !== r))}><X className="w-3 h-3" /></button>
              </span>
            ))}
            <AddChip placeholder="e.g. React Developer" onAdd={v => { if (!targetRoles.includes(v)) setTargetRoles([...targetRoles, v]); }} />
          </div>
        </div>

        {/* Skills */}
        <div className="border-t pt-4">
          <label className="text-sm font-medium mb-2 block">🛠️ Skills</label>
          {([['frontend', 'Frontend', frontendSkills], ['backend', 'Backend', backendSkills], ['database', 'Database', databaseSkills], ['tools', 'Tools', toolsSkills], ['orm', 'ORM', ormSkills]] as [string, string, string[]][]).map(([key, label, skills]) => (
            <div key={key} className="mb-3">
              <span className="text-xs text-gray-500 font-medium">{label}</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {skills.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full flex items-center gap-1">
                    {s}
                    <button onClick={() => removeSkill(key, s)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          ))}
          <SkillAddChip onAdd={addSkill} />
        </div>
      </div>

      {/* Platform Accounts */}
      <div className="card space-y-6">
        {cardHeader(<Link2 className="w-5 h-5 text-blue-600" />, 'Platform Accounts', settingsDirty, saveMut.isPending, () => saveMut.mutate())}
        <p className="text-sm text-gray-500">Add your credentials so CareerPilot can auto-login and apply on your behalf.</p>

        {/* LinkedIn */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">🔗 LinkedIn</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">Profile URL</label>
              <input type="url" placeholder="https://linkedin.com/in/yourname" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input type="email" placeholder="your@email.com" value={linkedinEmail} onChange={e => setLinkedinEmail(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Password</label>
              <input type="password" placeholder="••••••••" value={linkedinPass} onChange={e => setLinkedinPass(e.target.value)} className="input" />
            </div>
          </div>
        </div>

        {/* Naukri */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">📋 Naukri</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">Profile URL</label>
              <input type="url" placeholder="https://naukri.com/mnjuser/profile" value={naukriUrl} onChange={e => setNaukriUrl(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input type="email" placeholder="your@email.com" value={naukriEmail} onChange={e => setNaukriEmail(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Password</label>
              <input type="password" placeholder="••••••••" value={naukriPass} onChange={e => setNaukriPass(e.target.value)} className="input" />
            </div>
          </div>
        </div>

        {/* Indeed */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">💼 Indeed</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">Profile URL</label>
              <input type="url" placeholder="https://in.indeed.com/me/yourname" value={indeedUrl} onChange={e => setIndeedUrl(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input type="email" placeholder="your@email.com" value={indeedEmail} onChange={e => setIndeedEmail(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Password</label>
              <input type="password" placeholder="••••••••" value={indeedPass} onChange={e => setIndeedPass(e.target.value)} className="input" />
            </div>
          </div>
        </div>

        {/* Glassdoor */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">🏢 Glassdoor</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">Profile URL</label>
              <input type="url" placeholder="https://glassdoor.co.in/profile" value={glassdoorUrl} onChange={e => setGlassdoorUrl(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input type="email" placeholder="your@email.com" value={glassdoorEmail} onChange={e => setGlassdoorEmail(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Password</label>
              <input type="password" placeholder="••••••••" value={glassdoorPass} onChange={e => setGlassdoorPass(e.target.value)} className="input" />
            </div>
          </div>
        </div>

        {/* Instahyre */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">🚀 Instahyre</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">Profile URL</label>
              <input type="url" placeholder="https://instahyre.com/candidate/profile" value={instahyreUrl} onChange={e => setInstahyreUrl(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input type="email" placeholder="your@email.com" value={instahyreEmail} onChange={e => setInstahyreEmail(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Password</label>
              <input type="password" placeholder="••••••••" value={instahyrePass} onChange={e => setInstahyrePass(e.target.value)} className="input" />
            </div>
          </div>
        </div>

        {/* Foundit */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">🔍 Foundit (Monster India)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">Profile URL</label>
              <input type="url" placeholder="https://foundit.in/profile" value={founditUrl} onChange={e => setFounditUrl(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input type="email" placeholder="your@email.com" value={founditEmail} onChange={e => setFounditEmail(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Password</label>
              <input type="password" placeholder="••••••••" value={founditPass} onChange={e => setFounditPass(e.target.value)} className="input" />
            </div>
          </div>
        </div>

        {/* Wellfound */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">🌟 Wellfound (AngelList)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">Profile URL</label>
              <input type="url" placeholder="https://wellfound.com/u/yourname" value={wellfoundUrl} onChange={e => setWellfoundUrl(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input type="email" placeholder="your@email.com" value={wellfoundEmail} onChange={e => setWellfoundEmail(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Password</label>
              <input type="password" placeholder="••••••••" value={wellfoundPass} onChange={e => setWellfoundPass(e.target.value)} className="input" />
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">⚠️ Credentials are stored locally on your machine only. Never sent to any cloud service.</p>
        </div>
      </div>

      {/* AI Model & Job Filters */}
      <div className="card space-y-6">
        {cardHeader(<span className="text-lg">🤖</span>, 'AI Model & Job Filters', settingsDirty, saveMut.isPending, () => saveMut.mutate())}
        <p className="text-sm text-gray-500">Choose which AI model powers matching/resume generation, and set filters to auto-reject irrelevant jobs.</p>

        {/* Hardware Mode */}
        <div>
          <label className="block text-sm font-medium mb-2">🖥️ Hardware Mode (AI Model Selection)</label>
          <select value={hardwareMode} onChange={e => setHardwareMode(e.target.value)} className="input">
            <option value="low">Low (8GB RAM) - Qwen 1.5B / Llama3 Q4</option>
            <option value="medium">Medium (16GB RAM) - Llama3 8B / DeepSeek 8B</option>
            <option value="high">High (32GB RAM) - Qwen 14B / DeepSeek 14B</option>
          </select>
        </div>

        {/* Auto Search */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">⏰ Automatic Job Search</label>
            <p className="text-xs text-gray-500">Runs at 08:00 and 20:00 IST</p>
          </div>
          <button onClick={() => setAutoSearch(!autoSearch)}
            className={`w-12 h-6 rounded-full transition-colors ${autoSearch ? 'bg-primary-600' : 'bg-gray-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${autoSearch ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">🎯 Job Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">Min Salary (LPA)</label>
              <input type="number" value={minSalary} onChange={e => setMinSalary(+e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Max Experience (Years)</label>
              <input type="number" value={maxExperience} onChange={e => setMaxExperience(+e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Min Match Score (%)</label>
              <input type="number" value={minMatchScore} onChange={e => setMinMatchScore(+e.target.value)} className="input" />
            </div>
          </div>
        </div>

        {/* Excluded Titles */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-2">🚫 Excluded Titles</h3>
          <div className="flex flex-wrap gap-2">
            {['Lead', 'Principal', 'Architect', 'Manager', 'Staff Engineer', 'Director'].map(t => (
              <span key={t} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2">💡 Hardware Guide</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li><strong>Low (8GB):</strong> Uses smaller quantized models. Slower but works on any machine.</li>
          <li><strong>Medium (16GB):</strong> Best balance of speed and quality. Recommended.</li>
          <li><strong>High (32GB):</strong> Uses larger models for highest quality outputs.</li>
        </ul>
      </div>
    </div>
  );
}
