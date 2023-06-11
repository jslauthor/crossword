import React, { FunctionComponent } from 'react';

interface ExampleCubeProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

const ExampleCube: FunctionComponent<ExampleCubeProps> = ({
  width = 91,
  height = 51,
  className,
}) => {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 91 51"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M39.8203 29.5858L36.1464 29.1794V34.0389L39.8203 34.8652V29.5858Z"
        fill="#829B9E"
      />
      <path
        d="M28.9496 28.3844L26.5329 28.1164V31.8771L28.9496 32.422V28.3844Z"
        fill="#829B9E"
      />
      <path
        d="M35.7199 29.1303L32.6368 28.7908V33.2483L35.7199 33.9451V29.1303Z"
        fill="#829B9E"
      />
      <path
        d="M26.1064 28.0717L23.6897 27.8037V31.2384L26.1064 31.7789V28.0717Z"
        fill="#829B9E"
      />
      <path
        d="M21.5129 20.3983L23.2632 20.2063V16.8207L21.5129 17.2137V20.3983Z"
        fill="#829B9E"
      />
      <path
        d="M23.2632 31.1402V27.7546L21.5129 27.5625V30.7471L23.2632 31.1402Z"
        fill="#829B9E"
      />
      <path
        d="M23.2632 23.6946V20.635L21.5129 20.8271V23.6946H23.2632Z"
        fill="#829B9E"
      />
      <path
        d="M32.2103 28.7417L29.376 28.429V32.5158L32.2103 33.1545V28.7417Z"
        fill="#829B9E"
      />
      <path
        d="M36.1464 13.4798L39.8203 12.6535V7.24014L36.1464 8.50415V13.4798Z"
        fill="#829B9E"
      />
      <path
        d="M32.6368 14.2704L35.7199 13.5781V8.65155L32.6368 9.71457V14.2704Z"
        fill="#829B9E"
      />
      <path
        d="M40.2468 7.09274V12.5597L44.5959 11.5815V5.59201L40.2468 7.09274Z"
        fill="#7DC69C"
      />
      <path
        d="M40.2468 12.9974V18.3304L44.5959 17.848V12.0193L40.2468 12.9974Z"
        fill="#7DC69C"
      />
      <path
        d="M36.1464 24.1055V28.7461L39.8203 29.1526V24.101L36.1464 24.1055Z"
        fill="#829B9E"
      />
      <path
        d="M23.6897 20.1571L26.1064 19.8891V16.1775L23.6897 16.7224V20.1571Z"
        fill="#829B9E"
      />
      <path
        d="M39.8203 13.0957L36.1464 13.922V18.7815L39.8203 18.375V13.0957Z"
        fill="#829B9E"
      />
      <path
        d="M32.6368 19.17L35.7199 18.8306V14.0157L32.6368 14.7125V19.17Z"
        fill="#829B9E"
      />
      <path
        d="M26.5329 23.6901L28.9496 23.6856V20.0097L26.5329 20.2733V23.6901Z"
        fill="#829B9E"
      />
      <path
        d="M21.0864 13.6942L19.4649 14.2525V17.2316L21.0864 16.8698V13.6942Z"
        fill="#7DC69C"
      />
      <path
        d="M32.2103 19.6479L29.376 19.9606V23.6856L32.2103 23.6812V19.6479Z"
        fill="#829B9E"
      />
      <path
        d="M26.5329 19.8445L28.9496 19.5765V15.5388L26.5329 16.0837V19.8445Z"
        fill="#829B9E"
      />
      <path
        d="M29.376 19.5274L32.2103 19.2147V14.8063L29.376 15.445V19.5274Z"
        fill="#829B9E"
      />
      <path
        d="M35.7199 24.1055L32.6368 24.11V28.3576L35.7199 28.7015V24.1055Z"
        fill="#829B9E"
      />
      <path
        d="M23.6897 23.6946L26.1064 23.6901V20.3224L23.6897 20.5904V23.6946Z"
        fill="#829B9E"
      />
      <path
        d="M28.9496 24.1144L26.5329 24.1189V27.6831L28.9496 27.9511V24.1144Z"
        fill="#829B9E"
      />
      <path
        d="M32.2103 24.11L29.376 24.1144V28.0002L32.2103 28.3129V24.11Z"
        fill="#829B9E"
      />
      <path
        d="M44.5959 5.1409V0L40.2468 2.02777V6.63716L44.5959 5.1409Z"
        fill="#7DC69C"
      />
      <path
        d="M21.0864 13.2431V10.9696L19.4649 11.7245V13.8014L21.0864 13.2431Z"
        fill="#7DC69C"
      />
      <path
        d="M23.2632 12.4927V9.95575L21.5129 10.7686V13.0957L23.2632 12.4927Z"
        fill="#829B9E"
      />
      <path
        d="M39.8203 6.78455V2.22876L36.1464 3.94388V8.05303L39.8203 6.78455Z"
        fill="#829B9E"
      />
      <path
        d="M35.7199 8.19596V4.14041L32.6368 5.57861V9.26344L35.7199 8.19596Z"
        fill="#829B9E"
      />
      <path
        d="M26.1064 11.5145V8.62921L23.6897 9.75476V12.3453L26.1064 11.5145Z"
        fill="#829B9E"
      />
      <path
        d="M36.1464 39.9078V44.3966L39.8203 46.1073V41.1763L36.1464 39.9078Z"
        fill="#829B9E"
      />
      <path
        d="M40.2468 41.3237V46.3083L44.5959 48.336V42.82L40.2468 41.3237Z"
        fill="#7DC69C"
      />
      <path
        d="M32.6368 38.6974V42.7574L35.7199 44.1956V39.7604L32.6368 38.6974Z"
        fill="#829B9E"
      />
      <path
        d="M19.4649 34.1595V36.6116L21.0864 37.3664V34.7178L19.4649 34.1595Z"
        fill="#7DC69C"
      />
      <path
        d="M26.5329 15.6415L28.9496 15.1011V10.9875L26.5329 11.8182V15.6415Z"
        fill="#829B9E"
      />
      <path
        d="M23.6897 35.6156V38.5813L26.1064 39.7068V36.4463L23.6897 35.6156Z"
        fill="#829B9E"
      />
      <path
        d="M21.5129 34.8652V37.5674L23.2632 38.3803V35.4682L21.5129 34.8652Z"
        fill="#829B9E"
      />
      <path
        d="M21.0864 30.6533V27.5179L19.4649 27.3347V30.2871L21.0864 30.6533Z"
        fill="#7DC69C"
      />
      <path
        d="M21.0864 20.8763L19.4649 21.0549V23.6991H21.0864V20.8763Z"
        fill="#7DC69C"
      />
      <path
        d="M21.0864 31.091L19.4649 30.7292V33.7039L21.0864 34.2622V31.091Z"
        fill="#7DC69C"
      />
      <path
        d="M23.2632 31.5823L21.5129 31.1893V34.4096L23.2632 35.0126V31.5823Z"
        fill="#829B9E"
      />
      <path
        d="M21.0864 17.3075L19.4649 17.6738V20.6216L21.0864 20.443V17.3075Z"
        fill="#7DC69C"
      />
      <path
        d="M23.6897 16.2847L26.1064 15.7398V11.9656L23.6897 12.8009V16.2847Z"
        fill="#829B9E"
      />
      <path
        d="M21.5129 16.7716L23.2632 16.3785V12.9483L21.5129 13.5468V16.7716Z"
        fill="#829B9E"
      />
      <path
        d="M40.2468 24.101V29.1973L44.5959 29.6796V24.0921L40.2468 24.101Z"
        fill="#7DC69C"
      />
      <path
        d="M44.5959 36.3793L40.2468 35.4012V40.8681L44.5959 42.3689V36.3793Z"
        fill="#7DC69C"
      />
      <path
        d="M39.8203 35.3074L36.1464 34.4811V39.4567L39.8203 40.7207V35.3074Z"
        fill="#829B9E"
      />
      <path
        d="M40.2468 29.6305V34.9634L44.5959 35.9416V30.1129L40.2468 29.6305Z"
        fill="#7DC69C"
      />
      <path
        d="M26.1064 32.2211L23.6897 31.6761V35.16L26.1064 35.9952V32.2211Z"
        fill="#829B9E"
      />
      <path
        d="M32.2103 33.5922L29.376 32.958V37.1207L32.2103 38.0989V33.5922Z"
        fill="#829B9E"
      />
      <path
        d="M35.7199 34.3828L32.6368 33.6905V38.2463L35.7199 39.3093V34.3828Z"
        fill="#829B9E"
      />
      <path
        d="M49.7759 29.5858L53.4454 29.1794V34.0389L49.7759 34.8652V29.5858Z"
        fill="#455E61"
      />
      <path
        d="M60.6466 28.3844L63.0633 28.1164V31.8771L60.6466 32.422V28.3844Z"
        fill="#455E61"
      />
      <path
        d="M53.8718 29.1303L56.9593 28.7908V33.2483L53.8718 33.9451V29.1303Z"
        fill="#455E61"
      />
      <path
        d="M63.4898 28.0717L65.9065 27.8037V31.2384L63.4898 31.7789V28.0717Z"
        fill="#455E61"
      />
      <path
        d="M68.0788 20.3983L66.3329 20.2063V16.8207L68.0788 17.2137V20.3983Z"
        fill="#455E61"
      />
      <path
        d="M66.3329 31.1402V27.7546L68.0788 27.5625V30.7471L66.3329 31.1402Z"
        fill="#455E61"
      />
      <path
        d="M66.3329 23.6946V20.635L68.0788 20.8271V23.6946H66.3329Z"
        fill="#455E61"
      />
      <path
        d="M57.3859 28.7417L60.2202 28.429V32.5158L57.3859 33.1545V28.7417Z"
        fill="#455E61"
      />
      <path
        d="M53.4454 13.4798L49.7759 12.6535V7.24014L53.4454 8.50415V13.4798Z"
        fill="#455E61"
      />
      <path
        d="M56.9593 14.2704L53.8718 13.5781V8.65155L56.9593 9.71457V14.2704Z"
        fill="#455E61"
      />
      <path
        d="M49.3494 7.09274V12.5597L44.9958 11.5815V5.59201L49.3494 7.09274Z"
        fill="#52896B"
      />
      <path
        d="M49.3494 12.9974V18.3304L44.9958 17.848V12.0193L49.3494 12.9974Z"
        fill="#52896B"
      />
      <path
        d="M53.4454 24.1055V28.7461L49.7759 29.1526V24.101L53.4454 24.1055Z"
        fill="#455E61"
      />
      <path
        d="M65.9065 20.1571L63.4898 19.8891V16.1775L65.9065 16.7224V20.1571Z"
        fill="#455E61"
      />
      <path
        d="M49.7759 13.0957L53.4454 13.922V18.7815L49.7759 18.375V13.0957Z"
        fill="#455E61"
      />
      <path
        d="M56.9593 19.17L53.8718 18.8306V14.0157L56.9593 14.7125V19.17Z"
        fill="#455E61"
      />
      <path
        d="M63.0633 23.6901L60.6466 23.6856V20.0097L63.0633 20.2733V23.6901Z"
        fill="#455E61"
      />
      <path
        d="M68.5054 13.6942L70.1269 14.2525V17.2316L68.5054 16.8698V13.6942Z"
        fill="#52896B"
      />
      <path
        d="M57.3859 19.6479L60.2202 19.9606V23.6856L57.3859 23.6812V19.6479Z"
        fill="#455E61"
      />
      <path
        d="M63.0633 19.8445L60.6466 19.5765V15.5388L63.0633 16.0837V19.8445Z"
        fill="#455E61"
      />
      <path
        d="M60.2202 19.5274L57.3859 19.2147V14.8063L60.2202 15.445V19.5274Z"
        fill="#455E61"
      />
      <path
        d="M53.8718 24.1055L56.9593 24.11V28.3576L53.8718 28.7015V24.1055Z"
        fill="#455E61"
      />
      <path
        d="M65.9065 23.6946L63.4898 23.6901V20.3224L65.9065 20.5904V23.6946Z"
        fill="#455E61"
      />
      <path
        d="M60.6466 24.1144L63.0633 24.1189V27.6831L60.6466 27.9511V24.1144Z"
        fill="#455E61"
      />
      <path
        d="M57.3859 24.11L60.2202 24.1144V28.0002L57.3859 28.3129V24.11Z"
        fill="#455E61"
      />
      <path
        d="M60.2202 37.5763V41.2344L57.3859 42.5564V38.55L60.2202 37.5763Z"
        fill="#455E61"
      />
      <path
        d="M60.6466 10.5319V7.30267L63.0633 8.42822V11.3672L60.6466 10.5319Z"
        fill="#455E61"
      />
      <path
        d="M44.9958 5.1409V0L49.3494 2.02777V6.63716L44.9958 5.1409Z"
        fill="#52896B"
      />
      <path
        d="M68.5054 13.2431V10.9696L70.1269 11.7245V13.8014L68.5054 13.2431Z"
        fill="#52896B"
      />
      <path
        d="M66.3329 12.4927V9.95575L68.0788 10.7686V13.0957L66.3329 12.4927Z"
        fill="#455E61"
      />
      <path
        d="M49.7759 6.78455V2.22876L53.4454 3.94388V8.05303L49.7759 6.78455Z"
        fill="#455E61"
      />
      <path
        d="M53.8718 8.19596V4.14041L56.9593 5.57861V9.26344L53.8718 8.19596Z"
        fill="#455E61"
      />
      <path
        d="M63.4898 11.5145V8.62921L65.9065 9.75476V12.3453L63.4898 11.5145Z"
        fill="#455E61"
      />
      <path
        d="M53.4454 39.9078V44.3966L49.7759 46.1073V41.1763L53.4454 39.9078Z"
        fill="#455E61"
      />
      <path
        d="M49.3494 41.3237V46.3083L44.9958 48.336V42.82L49.3494 41.3237Z"
        fill="#52896B"
      />
      <path
        d="M56.9593 38.6974V42.7574L53.8718 44.1956V39.7604L56.9593 38.6974Z"
        fill="#455E61"
      />
      <path
        d="M70.1269 34.1595V36.6116L68.5054 37.3664V34.7178L70.1269 34.1595Z"
        fill="#52896B"
      />
      <path
        d="M63.0633 15.6415L60.6466 15.1011V10.9875L63.0633 11.8182V15.6415Z"
        fill="#455E61"
      />
      <path
        d="M65.9065 35.6156V38.5813L63.4898 39.7068V36.4463L65.9065 35.6156Z"
        fill="#455E61"
      />
      <path
        d="M68.0788 34.8652V37.5674L66.3329 38.3803V35.4682L68.0788 34.8652Z"
        fill="#455E61"
      />
      <path
        d="M68.5054 30.6533V27.5179L70.1269 27.3347V30.2871L68.5054 30.6533Z"
        fill="#52896B"
      />
      <path
        d="M68.5054 20.8763L70.1269 21.0549V23.6991H68.5054V20.8763Z"
        fill="#52896B"
      />
      <path
        d="M68.5054 31.091L70.1269 30.7292V33.7039L68.5054 34.2622V31.091Z"
        fill="#52896B"
      />
      <path
        d="M66.3329 31.5823L68.0788 31.1893V34.4096L66.3329 35.0126V31.5823Z"
        fill="#455E61"
      />
      <path
        d="M68.5054 17.3075L70.1269 17.6738V20.6216L68.5054 20.443V17.3075Z"
        fill="#52896B"
      />
      <path
        d="M65.9065 16.2847L63.4898 15.7398V11.9656L65.9065 12.8009V16.2847Z"
        fill="#455E61"
      />
      <path
        d="M68.0788 16.7716L66.3329 16.3785V12.9483L68.0788 13.5468V16.7716Z"
        fill="#455E61"
      />
      <path
        d="M49.3494 24.101V29.1973L44.9958 29.6796V24.0921L49.3494 24.101Z"
        fill="#52896B"
      />
      <path
        d="M44.9958 36.3793L49.3494 35.4012V40.8681L44.9958 42.3689V36.3793Z"
        fill="#52896B"
      />
      <path
        d="M49.7759 35.3074L53.4454 34.4811V39.4567L49.7759 40.7207V35.3074Z"
        fill="#455E61"
      />
      <path
        d="M49.3494 29.6305V34.9634L44.9958 35.9416V30.1129L49.3494 29.6305Z"
        fill="#52896B"
      />
      <path
        d="M63.4898 32.2211L65.9065 31.6761V35.16L63.4898 35.9952V32.2211Z"
        fill="#455E61"
      />
      <path
        d="M57.3859 33.5922L60.2202 32.958V37.1207L57.3859 38.0989V33.5922Z"
        fill="#455E61"
      />
      <path
        d="M53.8718 34.3828L56.9593 33.6905V38.2463L53.8718 39.3093V34.3828Z"
        fill="#455E61"
      />
      <path
        d="M10.2955 20.4231C10.2955 20.4231 9.39248 20.8069 8.17009 21.2834C6.94771 21.76 5.22889 23.0893 5.22889 23.0893C5.22889 23.0893 4.08384 22.7707 3.27557 21.3436C3.39282 20.6488 4.08384 20.1322 4.97444 19.7158C5.86503 19.2995 7.17472 18.9534 7.59882 18.853C9.01079 18.5144 10.1509 18.4091 10.1509 18.4091L10.2955 20.4231Z"
        fill="#B1E3E9"
      />
      <path
        d="M13.4388 29.8788C11.6975 29.9164 9.96375 29.6405 7.83331 28.9056C4.85219 27.7544 4.49795 26.1065 4.49795 26.1065L3.31299 22.6754C5.99724 25.4344 11.6975 25.2187 13.6184 25.2563L13.6583 22.8359L17.4677 27.3405L13.4014 31.7849L13.4413 29.8788H13.4388Z"
        fill="#72BBC4"
      />
      <path
        d="M79.449 20.4231C79.449 20.4231 80.3521 20.8069 81.5745 21.2834C82.7969 21.76 84.5157 23.0893 84.5157 23.0893C84.5157 23.0893 85.6607 22.7707 86.469 21.3436C86.3517 20.6488 85.6607 20.1322 84.7701 19.7158C83.8795 19.2995 82.5698 18.9534 82.1458 18.853C80.7338 18.5144 79.5937 18.4091 79.5937 18.4091L79.449 20.4231Z"
        fill="#B1E3E9"
      />
      <path
        d="M76.3058 29.8788C78.047 29.9164 79.7808 29.6405 81.9113 28.9056C84.8924 27.7544 85.2466 26.1065 85.2466 26.1065L86.4316 22.6754C83.7473 25.4344 78.047 25.2187 76.1261 25.2563L76.0862 22.8359L72.2769 27.3405L76.3432 31.7849L76.3033 29.8788H76.3058Z"
        fill="#72BBC4"
      />
      <path
        d="M46.2587 4.73892V4.33225V2.05057V1.64389L46.8431 1.82368V2.23036V4.46495L48.4231 4.9444V5.39817L46.2587 4.74321V4.73892Z"
        fill="white"
      />
      <path
        d="M45.7167 8.98414C45.7167 8.1451 46.2647 7.56719 47.1962 7.75554C48.1277 7.9439 48.6802 8.74869 48.6802 9.58773C48.6802 10.4268 48.1277 11.009 47.1962 10.8206C46.2647 10.6323 45.7167 9.82746 45.7167 8.98414ZM48.0638 9.46359C48.0638 8.72301 47.6939 8.2778 47.1962 8.17506C46.6985 8.07232 46.3286 8.3677 46.3286 9.10828C46.3286 9.84887 46.6985 10.2984 47.1962 10.4011C47.6939 10.5038 48.0638 10.2085 48.0638 9.46359Z"
        fill="white"
      />
      <path
        d="M46.6924 15.5245V16.736L46.1171 16.6418V16.2308V13.9277V13.5168L47.4687 13.7394C47.9846 13.825 48.6239 14.0519 48.6239 14.8652C48.6239 15.6786 48.0394 15.7428 47.5052 15.6572L46.6924 15.5245ZM46.6924 15.075L47.3956 15.1906C47.7472 15.2462 48.0349 15.2248 48.0349 14.7796C48.0349 14.3344 47.7244 14.2274 47.3956 14.1718L46.6924 14.0562V15.075Z"
        fill="white"
      />
      <path
        d="M41.35 5.38535V4.97439L41.3591 2.69271V2.28603L41.939 2.07199V2.48295L41.9299 4.71754L43.4961 4.14819V4.60196L41.35 5.38107V5.38535Z"
        fill="white"
      />
      <path
        d="M40.8919 9.48675C40.8919 8.64771 41.4399 7.87288 42.3714 7.73162C43.3029 7.59035 43.8554 8.19823 43.8554 9.03727C43.8554 9.87631 43.3029 10.6554 42.3714 10.7967C41.4399 10.938 40.8919 10.3301 40.8919 9.48675ZM43.2389 9.13145C43.2389 8.39086 42.8691 8.07836 42.3714 8.15114C41.8736 8.22391 41.5038 8.65199 41.5038 9.39258C41.5038 10.1332 41.8736 10.4499 42.3714 10.3772C42.8691 10.3044 43.2389 9.87631 43.2389 9.13145Z"
        fill="white"
      />
      <path
        d="M41.8193 15.6462V16.772L41.244 16.8876V16.5023V14.3576V13.9766L42.5956 13.707C43.1115 13.6042 43.7508 13.5914 43.7508 14.3491C43.7508 15.1068 43.1663 15.3765 42.6321 15.4835L41.8193 15.6462ZM41.8193 15.2266L42.5225 15.0854C42.8741 15.0169 43.1618 14.8927 43.1618 14.4775C43.1618 14.0623 42.8513 14.0708 42.5225 14.1393L41.8193 14.2806V15.2309V15.2266Z"
        fill="white"
      />
    </svg>
  );
};

export default ExampleCube;
