# Translation Key Additions
Copy-paste these blocks into the respective translation files to fix critical missing keys.

---

## 1. English (en.ts)

Add these keys at the end of the file, before the closing `};`:

```typescript
    // Empty States - User-facing empty content messages
    emptyState: {
        noPets: {
            title: `No Pets Yet`,
            description: `Start by registering your first pet to unlock all features and keep them safe.`,
            action: `Register Pet`
        },
        noResults: {
            title: `No Results Found`,
            description: `Try adjusting your filters or search terms.`,
            descriptionWithQuery: `No matches found for "{{query}}". Try adjusting your search.`,
            action: `Clear Filters`
        },
        noMessages: {
            title: `No Messages`,
            description: `When you receive messages or notifications, they'll appear here.`
        },
        noSightings: {
            title: `No Sightings Yet`,
            description: `Sightings from the community will appear here when someone spots your pet.`
        },
        noAppointments: {
            title: `No Upcoming Appointments`,
            description: `Schedule a vet visit to keep your pet healthy and happy.`,
            action: `Book Appointment`
        },
        error: {
            title: `Something Went Wrong`,
            description: `We couldn't load this content. Please try again.`,
            action: `Retry`
        },
        offline: {
            title: `You're Offline`,
            description: `Please check your internet connection and try again.`
        }
    },

    // Error Boundary
    systemAnomalyDetected: `System Anomaly Detected`,
    systemAnomalyDescription: `Our neural network encountered an unexpected glitch. The rescue mission has been paused.`,
    rebootSystem: `Reboot System`
```

---

## 2. Italian (it.ts)

```typescript
    // Empty States
    emptyState: {
        noPets: {
            title: `Nessun Animale`,
            description: `Inizia registrando il tuo primo animale per sbloccare tutte le funzionalità e tenerlo al sicuro.`,
            action: `Registra Animale`
        },
        noResults: {
            title: `Nessun Risultato`,
            description: `Prova a modificare i filtri o i termini di ricerca.`,
            descriptionWithQuery: `Nessuna corrispondenza per "{{query}}". Prova a modificare la ricerca.`,
            action: `Cancella Filtri`
        },
        noMessages: {
            title: `Nessun Messaggio`,
            description: `Quando riceverai messaggi o notifiche, appariranno qui.`
        },
        noSightings: {
            title: `Nessun Avvistamento`,
            description: `Gli avvistamenti della community appariranno qui quando qualcuno vedrà il tuo animale.`
        },
        noAppointments: {
            title: `Nessun Appuntamento`,
            description: `Prenota una visita dal veterinario per mantenere il tuo animale sano e felice.`,
            action: `Prenota Visita`
        },
        error: {
            title: `Qualcosa è Andato Storto`,
            description: `Non siamo riusciti a caricare questo contenuto. Riprova.`,
            action: `Riprova`
        },
        offline: {
            title: `Sei Offline`,
            description: `Controlla la tua connessione internet e riprova.`
        }
    },

    // Error Boundary
    systemAnomalyDetected: `Anomalia di Sistema Rilevata`,
    systemAnomalyDescription: `La nostra rete neurale ha riscontrato un problema inaspettato. La missione di soccorso è stata sospesa.`,
    rebootSystem: `Riavvia Sistema`
```

---

## 3. Spanish (es.ts)

```typescript
    // Empty States
    emptyState: {
        noPets: {
            title: `Sin Mascotas`,
            description: `Comienza registrando tu primera mascota para desbloquear todas las funciones y mantenerla segura.`,
            action: `Registrar Mascota`
        },
        noResults: {
            title: `Sin Resultados`,
            description: `Intenta ajustar los filtros o términos de búsqueda.`,
            descriptionWithQuery: `No hay coincidencias para "{{query}}". Intenta ajustar la búsqueda.`,
            action: `Limpiar Filtros`
        },
        noMessages: {
            title: `Sin Mensajes`,
            description: `Cuando recibas mensajes o notificaciones, aparecerán aquí.`
        },
        noSightings: {
            title: `Sin Avistamientos`,
            description: `Los avistamientos de la comunidad aparecerán aquí cuando alguien vea tu mascota.`
        },
        noAppointments: {
            title: `Sin Citas Próximas`,
            description: `Agenda una visita al veterinario para mantener a tu mascota saludable y feliz.`,
            action: `Reservar Cita`
        },
        error: {
            title: `Algo Salió Mal`,
            description: `No pudimos cargar este contenido. Por favor, inténtalo de nuevo.`,
            action: `Reintentar`
        },
        offline: {
            title: `Estás Desconectado`,
            description: `Por favor, verifica tu conexión a internet e inténtalo de nuevo.`
        }
    },

    // Error Boundary
    systemAnomalyDetected: `Anomalía del Sistema Detectada`,
    systemAnomalyDescription: `Nuestra red neuronal encontró un fallo inesperado. La misión de rescate ha sido pausada.`,
    rebootSystem: `Reiniciar Sistema`
```

---

## 4. French (fr.ts)

```typescript
    // Empty States
    emptyState: {
        noPets: {
            title: `Aucun Animal`,
            description: `Commencez par enregistrer votre premier animal pour débloquer toutes les fonctionnalités et le garder en sécurité.`,
            action: `Enregistrer Animal`
        },
        noResults: {
            title: `Aucun Résultat`,
            description: `Essayez d'ajuster vos filtres ou termes de recherche.`,
            descriptionWithQuery: `Aucune correspondance pour "{{query}}". Essayez d'ajuster votre recherche.`,
            action: `Effacer Filtres`
        },
        noMessages: {
            title: `Aucun Message`,
            description: `Lorsque vous recevrez des messages ou notifications, ils apparaîtront ici.`
        },
        noSightings: {
            title: `Aucune Observation`,
            description: `Les observations de la communauté apparaîtront ici lorsque quelqu'un repère votre animal.`
        },
        noAppointments: {
            title: `Aucun Rendez-vous`,
            description: `Planifiez une visite chez le vétérinaire pour garder votre animal en bonne santé.`,
            action: `Prendre Rendez-vous`
        },
        error: {
            title: `Une Erreur s'est Produite`,
            description: `Nous n'avons pas pu charger ce contenu. Veuillez réessayer.`,
            action: `Réessayer`
        },
        offline: {
            title: `Vous êtes Hors Ligne`,
            description: `Veuillez vérifier votre connexion internet et réessayer.`
        }
    },

    // Error Boundary
    systemAnomalyDetected: `Anomalie Système Détectée`,
    systemAnomalyDescription: `Notre réseau neuronal a rencontré un problème inattendu. La mission de sauvetage a été mise en pause.`,
    rebootSystem: `Redémarrer Système`
```

---

## 5. German (de.ts)

```typescript
    // Empty States
    emptyState: {
        noPets: {
            title: `Keine Haustiere`,
            description: `Beginnen Sie mit der Registrierung Ihres ersten Haustiers, um alle Funktionen freizuschalten und es sicher zu halten.`,
            action: `Haustier Registrieren`
        },
        noResults: {
            title: `Keine Ergebnisse`,
            description: `Versuchen Sie, Ihre Filter oder Suchbegriffe anzupassen.`,
            descriptionWithQuery: `Keine Übereinstimmungen für "{{query}}". Versuchen Sie, Ihre Suche anzupassen.`,
            action: `Filter Zurücksetzen`
        },
        noMessages: {
            title: `Keine Nachrichten`,
            description: `Wenn Sie Nachrichten oder Benachrichtigungen erhalten, werden sie hier angezeigt.`
        },
        noSightings: {
            title: `Keine Sichtungen`,
            description: `Sichtungen aus der Community werden hier angezeigt, wenn jemand Ihr Haustier entdeckt.`
        },
        noAppointments: {
            title: `Keine Termine`,
            description: `Vereinbaren Sie einen Tierarztbesuch, um Ihr Haustier gesund und glücklich zu halten.`,
            action: `Termin Buchen`
        },
        error: {
            title: `Etwas ist Schiefgelaufen`,
            description: `Wir konnten diesen Inhalt nicht laden. Bitte versuchen Sie es erneut.`,
            action: `Erneut Versuchen`
        },
        offline: {
            title: `Sie sind Offline`,
            description: `Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.`
        }
    },

    // Error Boundary
    systemAnomalyDetected: `System-Anomalie Erkannt`,
    systemAnomalyDescription: `Unser neuronales Netzwerk ist auf einen unerwarteten Fehler gestoßen. Die Rettungsmission wurde pausiert.`,
    rebootSystem: `System Neustarten`
```

---

## 6. Chinese (zh.ts)

```typescript
    // Empty States
    emptyState: {
        noPets: {
            title: `还没有宠物`,
            description: `开始注册您的第一只宠物，解锁所有功能并确保它们的安全。`,
            action: `注册宠物`
        },
        noResults: {
            title: `未找到结果`,
            description: `尝试调整您的筛选器或搜索词。`,
            descriptionWithQuery: `未找到"{{query}}"的匹配项。尝试调整您的搜索。`,
            action: `清除筛选器`
        },
        noMessages: {
            title: `没有消息`,
            description: `当您收到消息或通知时，它们将显示在这里。`
        },
        noSightings: {
            title: `还没有目击记录`,
            description: `当有人看到您的宠物时，社区的目击记录将显示在这里。`
        },
        noAppointments: {
            title: `没有即将到来的预约`,
            description: `安排兽医访问，保持您的宠物健康快乐。`,
            action: `预约`
        },
        error: {
            title: `出了点问题`,
            description: `我们无法加载此内容。请重试。`,
            action: `重试`
        },
        offline: {
            title: `您已离线`,
            description: `请检查您的互联网连接并重试。`
        }
    },

    // Error Boundary
    systemAnomalyDetected: `检测到系统异常`,
    systemAnomalyDescription: `我们的神经网络遇到了意外故障。救援任务已暂停。`,
    rebootSystem: `重启系统`
```

---

## 7. Arabic (ar.ts)

```typescript
    // Empty States
    emptyState: {
        noPets: {
            title: `لا توجد حيوانات`,
            description: `ابدأ بتسجيل أول حيوان أليف لفتح جميع الميزات والحفاظ على سلامته.`,
            action: `تسجيل حيوان أليف`
        },
        noResults: {
            title: `لم يتم العثور على نتائج`,
            description: `حاول ضبط الفلاتر أو مصطلحات البحث.`,
            descriptionWithQuery: `لم يتم العثور على نتائج لـ "{{query}}". حاول ضبط البحث.`,
            action: `مسح الفلاتر`
        },
        noMessages: {
            title: `لا توجد رسائل`,
            description: `عندما تتلقى رسائل أو إشعارات، ستظهر هنا.`
        },
        noSightings: {
            title: `لا توجد مشاهدات`,
            description: `ستظهر مشاهدات المجتمع هنا عندما يرى شخص ما حيوانك الأليف.`
        },
        noAppointments: {
            title: `لا توجد مواعيد قادمة`,
            description: `حدد موعدًا مع الطبيب البيطري للحفاظ على صحة حيوانك الأليف وسعادته.`,
            action: `حجز موعد`
        },
        error: {
            title: `حدث خطأ ما`,
            description: `لم نتمكن من تحميل هذا المحتوى. يرجى المحاولة مرة أخرى.`,
            action: `إعادة المحاولة`
        },
        offline: {
            title: `أنت غير متصل`,
            description: `يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.`
        }
    },

    // Error Boundary
    systemAnomalyDetected: `تم اكتشاف شذوذ في النظام`,
    systemAnomalyDescription: `واجهت شبكتنا العصبية خللاً غير متوقع. تم إيقاف مهمة الإنقاذ مؤقتًا.`,
    rebootSystem: `إعادة تشغيل النظام`
```

---

## 8. Romanian (ro.ts)

```typescript
    // Empty States
    emptyState: {
        noPets: {
            title: `Niciun Animal`,
            description: `Începeți prin a înregistra primul dumneavoastră animal pentru a debloca toate funcțiile și a-l păstra în siguranță.`,
            action: `Înregistrare Animal`
        },
        noResults: {
            title: `Niciun Rezultat`,
            description: `Încercați să ajustați filtrele sau termenii de căutare.`,
            descriptionWithQuery: `Nicio potrivire pentru "{{query}}". Încercați să ajustați căutarea.`,
            action: `Șterge Filtre`
        },
        noMessages: {
            title: `Niciun Mesaj`,
            description: `Când veți primi mesaje sau notificări, acestea vor apărea aici.`
        },
        noSightings: {
            title: `Nicio Observație`,
            description: `Observațiile comunității vor apărea aici când cineva vede animalul dumneavoastră.`
        },
        noAppointments: {
            title: `Nicio Programare`,
            description: `Programați o vizită la veterinar pentru a păstra animalul dumneavoastră sănătos și fericit.`,
            action: `Programare`
        },
        error: {
            title: `Ceva Nu A Funcționat`,
            description: `Nu am putut încărca acest conținut. Vă rugăm să încercați din nou.`,
            action: `Reîncercare`
        },
        offline: {
            title: `Sunteți Offline`,
            description: `Vă rugăm să verificați conexiunea la internet și să încercați din nou.`
        }
    },

    // Error Boundary
    systemAnomalyDetected: `Anomalie de Sistem Detectată`,
    systemAnomalyDescription: `Rețeaua noastră neuronală a întâmpinat o problemă neașteptată. Misiunea de salvare a fost suspendată.`,
    rebootSystem: `Repornire Sistem`
```

---

## Component Updates Required

### 1. EmptyState.tsx

Replace the hardcoded preset components with translated versions:

```typescript
import { useTranslations } from '../hooks/useTranslations';

export const EmptyStates = {
    NoPets: ({ onAction }: { onAction?: () => void }) => {
        const { t } = useTranslations();
        return (
            <EmptyState
                icon="🐾"
                title={t('emptyState.noPets.title')}
                description={t('emptyState.noPets.description')}
                actionLabel={onAction ? t('emptyState.noPets.action') : undefined}
                onAction={onAction}
            />
        );
    },

    NoResults: ({ query, onClear }: { query?: string; onClear?: () => void }) => {
        const { t } = useTranslations();
        return (
            <EmptyState
                icon="🔍"
                title={t('emptyState.noResults.title')}
                description={query
                    ? t('emptyState.noResults.descriptionWithQuery', { query })
                    : t('emptyState.noResults.description')
                }
                actionLabel={onClear ? t('emptyState.noResults.action') : undefined}
                onAction={onClear}
                actionVariant="secondary"
            />
        );
    },

    NoMessages: () => {
        const { t } = useTranslations();
        return (
            <EmptyState
                icon="💬"
                title={t('emptyState.noMessages.title')}
                description={t('emptyState.noMessages.description')}
                size="sm"
            />
        );
    },

    NoSightings: () => {
        const { t } = useTranslations();
        return (
            <EmptyState
                icon="👀"
                title={t('emptyState.noSightings.title')}
                description={t('emptyState.noSightings.description')}
                size="sm"
            />
        );
    },

    NoAppointments: ({ onAction }: { onAction?: () => void }) => {
        const { t } = useTranslations();
        return (
            <EmptyState
                icon="📅"
                title={t('emptyState.noAppointments.title')}
                description={t('emptyState.noAppointments.description')}
                actionLabel={onAction ? t('emptyState.noAppointments.action') : undefined}
                onAction={onAction}
            />
        );
    },

    Error: ({ onRetry }: { onRetry?: () => void }) => {
        const { t } = useTranslations();
        return (
            <EmptyState
                icon="⚠️"
                title={t('emptyState.error.title')}
                description={t('emptyState.error.description')}
                actionLabel={onRetry ? t('emptyState.error.action') : undefined}
                onAction={onRetry}
                actionVariant="secondary"
            />
        );
    },

    Offline: () => {
        const { t } = useTranslations();
        return (
            <EmptyState
                icon="📡"
                title={t('emptyState.offline.title')}
                description={t('emptyState.offline.description')}
                size="sm"
            />
        );
    },
};
```

### 2. ErrorBoundary.tsx

Update the ErrorUI component:

```typescript
const ErrorUI = ({ error }: { error: Error | null }) => {
    const { t } = useTranslations();
    return (
        <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center p-6 text-center font-mono-tech">
            <div className="max-w-md w-full glass-panel border-red-500/30 bg-red-500/5 p-8 rounded-2xl">
                <div className="text-6xl mb-4">😿</div>
                <h1 className="text-2xl font-bold text-red-500 mb-2 uppercase tracking-widest">
                    {t('systemAnomalyDetected')}
                </h1>
                <p className="text-slate-400 text-sm mb-6">
                    {t('systemAnomalyDescription')}
                </p>

                <div className="bg-black/50 p-4 rounded-lg mb-6 text-left overflow-auto max-h-32 border border-white/5">
                    <code className="text-[10px] text-red-400 font-mono">
                        {error && error.toString()}
                    </code>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="btn btn-primary w-full py-3 shadow-[0_0_20px_rgba(20,184,166,0.2)]"
                >
                    {t('rebootSystem')}
                </button>
            </div>
        </div>
    );
};
```

---

## Testing Checklist

After implementing these changes:

- [ ] Test each empty state preset in all 8 languages
- [ ] Trigger ErrorBoundary (throw error in component) and verify translations
- [ ] Test RTL layout for Arabic empty states
- [ ] Verify interpolation works for NoResults with query
- [ ] Check mobile layout for long translations (German)
- [ ] Ensure all buttons render correctly with translated text
- [ ] Test with screen reader to verify aria accessibility

---

## Notes

1. **Interpolation**: The `{{query}}` syntax is used for dynamic values in `descriptionWithQuery`
2. **RTL**: Arabic translations are written right-to-left and will display correctly with existing RTL support
3. **Character Encoding**: Ensure all files are saved as UTF-8 to preserve special characters
4. **Tone**: Translations maintain the futuristic tech tone consistent with the rest of the app
5. **Length**: German translations may be 20-30% longer; test on mobile layouts
