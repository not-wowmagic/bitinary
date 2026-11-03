import { Navigate, createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { AccountHome, BillingPage, HelpPage, PreferencesPage, ProfilePage, TeamPage } from '@/biz/pages/Account'
import { Analytics } from '@/biz/pages/Analytics'
import { Backgrounds } from '@/biz/pages/Backgrounds'
import { Comments } from '@/biz/pages/Comments'
import { Composer } from '@/biz/pages/Composer'
import { BoostPage, DealsPage, QrKit, ReservationsPage } from '@/biz/pages/Growth'
import { JimbotChat } from '@/biz/pages/JimbotChat'
import { BizContact, BizLanguage, BizLive, BizMethod, BizName, BizReady, BizSetupHub, BizSummary, BizVerify, BizWelcome } from '@/biz/pages/Onboarding'
import { Overview } from '@/biz/pages/Overview'
import { Posts } from '@/biz/pages/Posts'
import { CaseDetail, Cases, ReviewDetail, Reviews } from '@/biz/pages/Reviews'
import { BizSearch, DirectoryDetail, HelpDetail, ProgramDetail } from '@/biz/pages/Search'
import { BizScreenIndex } from '@/biz/ScreenIndex'
import { BizRoot, BizShell } from '@/biz/Shell'
import { Root } from '@/components/layout/Root'
import { Account } from '@/screens/Account'
import { BusinessDashboard, BusinessHub, BusinessLive, BusinessPreview } from '@/screens/business/Business'
import { HomeFull, HomeV1 } from '@/screens/Home'
import { ItineraryScreen } from '@/screens/Itinerary'
import { JimbotScreen } from '@/screens/Jimbot'
import { CreateMoment } from '@/screens/moments/CreateMoment'
import { MomentsCamera } from '@/screens/moments/MomentsCamera'
import { MomentsMap } from '@/screens/moments/MomentsMap'
import { NotFound } from '@/screens/NotFound'
import { PersonalizeHub } from '@/screens/personalize/Hub'
import { Preferences } from '@/screens/Preferences'
import { ReelsViewer } from '@/screens/ReelsViewer'
import { ComponentSheet, MascotSheet, ScreenIndex } from '@/screens/ScreenIndex'
import { SearchScreen } from '@/screens/Search'
import { ShopDetailScreen } from '@/screens/ShopDetail'
import { BusinessesScreen } from '@/screens/Businesses'
import { LanguagePick, Splash, Welcome } from '@/screens/signup/Entry'
import { ContactStep, MethodStep, NameStep, ReadyStep, RoleStep, VerifyStep } from '@/screens/signup/Signup'
import { ConsoleRoot, RequireDevAccount } from '@/dev/console/Shell'
import { Overview as DevOverview } from '@/dev/console/Overview'
import { UsersPage, UserDetail } from '@/dev/console/Users'
import { BusinessesPage, ModerationPage, AnnouncementsPage, FlagsPage, DataToolsPage, ActivityLogPage } from '@/dev/console/Ops'
import { VerificationPage, VerificationDetail } from '@/dev/console/Verification'
import { BannersPage, BannerEditor } from '@/dev/console/Banners'
import { ThemePage } from '@/dev/console/Theme'
import { TeamPage as DevTeamPage } from '@/dev/console/Team'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

export const router = createBrowserRouter(
  [
    {
      path: '/bitinarydev',
      Component: ConsoleRoot,
      children: [
        {
          Component: RequireDevAccount,
          children: [
            { index: true, Component: DevOverview },
            { path: 'users', Component: UsersPage },
            { path: 'users/:id', Component: UserDetail },
            { path: 'businesses', Component: BusinessesPage },
            { path: 'verification', Component: VerificationPage },
            { path: 'verification/:placeId', Component: VerificationDetail },
            { path: 'moderation', Component: ModerationPage },
            { path: 'banners', Component: BannersPage },
            { path: 'banners/new', Component: BannerEditor },
            { path: 'banners/:id', Component: BannerEditor },
            { path: 'announcements', Component: AnnouncementsPage },
            { path: 'theme', Component: ThemePage },
            { path: 'flags', Component: FlagsPage },
            { path: 'data', Component: DataToolsPage },
            { path: 'log', Component: ActivityLogPage },
            { path: 'team', Component: DevTeamPage },
          ],
        },
      ],
    },
    {
      // Bitinary Business: a separate, business-only app with its own sign-in, shell and data.
      path: '/biz',
      Component: BizRoot,
      children: [
        { index: true, element: <Navigate to="/biz/stats" replace /> },
        { path: 'screens', Component: BizScreenIndex },
        { path: 'language', Component: BizLanguage },
        { path: 'welcome', Component: BizWelcome },
        { path: 'auth', Component: BizMethod },
        { path: 'auth/verify', Component: BizVerify },
        { path: 'auth/email', Component: BizContact },
        { path: 'signup/name', Component: BizName },
        { path: 'signup/ready', Component: BizReady },
        { path: 'setup', Component: BizSetupHub },
        { path: 'setup/summary', Component: BizSummary },
        { path: 'setup/:id', Component: BizSetupHub },
        { path: 'live', Component: BizLive },
        {
          Component: BizShell,
          children: [
            { path: 'stats', Component: Overview },
            { path: 'stats/analytics', Component: Analytics },
            { path: 'stats/backgrounds', Component: Backgrounds },
            { path: 'jimbot', Component: JimbotChat },
            { path: 'search', Component: BizSearch },
            { path: 'search/business/:id', Component: DirectoryDetail },
            { path: 'search/program/:id', Component: ProgramDetail },
            { path: 'search/help/:id', Component: HelpDetail },
            { path: 'content', Component: Posts },
            { path: 'content/new', Component: Composer },
            { path: 'content/edit/:id', Component: Composer },
            { path: 'content/comments', Component: Comments },
            { path: 'content/reviews', Component: Reviews },
            { path: 'content/reviews/cases', Component: Cases },
            { path: 'content/reviews/cases/:id', Component: CaseDetail },
            { path: 'content/reviews/:id', Component: ReviewDetail },
            { path: 'account', Component: AccountHome },
            { path: 'account/profile', Component: ProfilePage },
            { path: 'account/team', Component: TeamPage },
            { path: 'account/qr', Component: QrKit },
            { path: 'account/deals', Component: DealsPage },
            { path: 'account/boost', Component: BoostPage },
            { path: 'account/reservations', Component: ReservationsPage },
            { path: 'account/billing', Component: BillingPage },
            { path: 'account/preferences', Component: PreferencesPage },
            { path: 'account/help', Component: HelpPage },
            { path: '*', element: <Navigate to="/biz/stats" replace /> },
          ],
        },
      ],
    },
    {
      path: '/',
      Component: Root,
      children: [
        { path: 'splash', Component: Splash },
        { path: 'language', Component: LanguagePick },
        { path: 'welcome', Component: Welcome },
        { path: 'onboarding', element: <Navigate to="/welcome" replace /> },
        { path: 'role', element: <Navigate to="/signup/role" replace /> },
        { path: 'signup/role', Component: RoleStep },
        { path: 'auth', Component: MethodStep },
        { path: 'auth/email', Component: ContactStep },
        { path: 'auth/verify', Component: VerifyStep },
        { path: 'signup/name', Component: NameStep },
        { path: 'signup/ready', Component: ReadyStep },
        { path: 'personalize', Component: PersonalizeHub },
        { path: 'personalize/:id', Component: PersonalizeHub },
        { path: 'business', Component: BusinessDashboard },
        { path: 'business/setup', Component: BusinessHub },
        { path: 'business/setup/:id', Component: BusinessHub },
        { path: 'business/hub', element: <Navigate to="/business/setup" replace /> },
        { path: 'business/preview', Component: BusinessPreview },
        { path: 'business/live', Component: BusinessLive },
        { path: 'reels/:id', Component: ReelsViewer },
        { path: 'screens', Component: ScreenIndex },
        { path: 'screens/components', Component: ComponentSheet },
        { path: 'screens/mascot', Component: MascotSheet },
        {
          Component: AppShell,
          children: [
            { index: true, Component: HomeFull },
            { path: 'home-v1', Component: HomeV1 },
            { path: 'jimbot', Component: JimbotScreen },
            { path: 'search', Component: SearchScreen },
            { path: 'shop/:id', Component: ShopDetailScreen },
            { path: 'negosyo', Component: BusinessesScreen },
            { path: 'itinerary/:id', Component: ItineraryScreen },
            { path: 'moments', Component: MomentsCamera },
            { path: 'moments/map', Component: MomentsMap },
            { path: 'moments/create', Component: CreateMoment },
            { path: 'account', Component: Account },
            { path: 'account/preferences', Component: Preferences },
            { path: '*', Component: NotFound },
          ],
        },
      ],
    },
  ],
  { basename },
)
