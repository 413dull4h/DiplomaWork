import i18n from 'i18next'; import LanguageDetector from 'i18next-browser-languagedetector'; import { initReactI18next } from 'react-i18next'
import en from './resources/en.json'; import ru from './resources/ru.json'; import ar from './resources/ar.json'; import bn from './resources/bn.json'; import zh from './resources/zh.json'; import fr from './resources/fr.json'; import de from './resources/de.json'; import es from './resources/es.json'
const supported=['en','ru','ar','bn','zh','fr','de','es']
void i18n.use(LanguageDetector).use(initReactI18next).init({resources:{en:{translation:en},ru:{translation:ru},ar:{translation:ar},bn:{translation:bn},zh:{translation:zh},fr:{translation:fr},de:{translation:de},es:{translation:es}},fallbackLng:'en',supportedLngs:supported,interpolation:{escapeValue:false},detection:{order:['localStorage','navigator'],caches:['localStorage'],lookupLocalStorage:'careos-hospital-language'}})
i18n.on('languageChanged',(lng)=>{const clean=supported.includes(lng)?lng:'en'; document.documentElement.lang=clean; document.documentElement.dir=clean==='ar'?'rtl':'ltr'; localStorage.setItem('careos-hospital-language',clean)})
const initial=supported.includes(i18n.language)?i18n.language:'en'; document.documentElement.lang=initial; document.documentElement.dir=initial==='ar'?'rtl':'ltr'
export const languages=[{code:'en',label:'English'},{code:'ru',label:'Русский'},{code:'ar',label:'العربية'},{code:'bn',label:'বাংলা'},{code:'zh',label:'中文'},{code:'fr',label:'Français'},{code:'de',label:'Deutsch'},{code:'es',label:'Español'}] as const
export default i18n
