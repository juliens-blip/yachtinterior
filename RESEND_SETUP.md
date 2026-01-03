# Configuration Resend + Supabase - YachtGenius

## 🎯 Guide de Configuration SMTP

Date: 2025-12-16
Status: À configurer

---

## ÉTAPE 1: Créer compte Resend

1. **URL**: https://resend.com/signup
2. **Plan**: Free (3000 emails/mois)
3. **Confirmation**: Vérifier votre email

---

## ÉTAPE 2: Obtenir API Key

1. Dashboard Resend → **API Keys**
2. **Create API Key**
3. Nom: `Supabase YachtGenius`
4. Permission: **Full access**
5. **COPIER** l'API key (commence par `re_...`)

⚠️ **IMPORTANT**: Sauvegardez cette clé, vous ne la reverrez plus!

---

## ÉTAPE 3: Configuration SMTP Supabase

### URL Configuration
https://supabase.com/dashboard/project/wyghcoahokqbhetlnpmq/settings/auth

### Paramètres SMTP Resend

```
Enable Custom SMTP:  ✅ Activé

Host:                smtp.resend.com
Port:                587
Username:            resend
Password:            [VOTRE API KEY Resend - re_...]

Sender Email:        onboarding@resend.dev
Sender Name:         YachtGenius
```

**Notes**:
- Username = toujours `resend` (pas votre email)
- Password = votre API Key Resend
- Sender Email = `onboarding@resend.dev` (domaine test) OU votre domaine custom

---

## ÉTAPE 4: Configuration Domaine (Optionnel - Production)

### Option A: Domaine Test (DEV)
- Email: `onboarding@resend.dev`
- ✅ Fonctionne immédiatement
- ⚠️ Limite: 1 email/jour par destinataire
- **Utilisez celui-ci pour l'instant**

### Option B: Domaine Custom (PROD)
Si vous avez un domaine (ex: `yachtgenius.com`):

1. Resend Dashboard → **Domains**
2. **Add Domain** → Entrer votre domaine
3. Ajouter les DNS records fournis par Resend:
   - SPF (TXT)
   - DKIM (TXT)
   - DMARC (TXT)
4. Attendre vérification (~10 min)
5. Changer Sender Email dans Supabase: `noreply@yachtgenius.com`

---

## ÉTAPE 5: Test de l'envoi

1. Aller sur http://localhost:3000/auth
2. Créer un compte avec un email RÉEL
3. Vérifier la réception de l'email de confirmation
4. Cliquer sur le lien de confirmation
5. Se connecter avec les credentials

---

## 🔧 Troubleshooting

### Erreur: "SMTP connection failed"
- Vérifier que l'API Key est correcte
- Vérifier Username = `resend` (pas votre email)
- Vérifier Port = 587 (pas 465)

### Erreur: "Invalid sender email"
- Utiliser `onboarding@resend.dev` pour les tests
- Si domaine custom: vérifier qu'il est vérifié dans Resend

### Email non reçu
- Vérifier les SPAM/Promotions
- Vérifier les logs Resend: https://resend.com/emails
- Vérifier les logs Supabase: Auth → Logs

---

## 📊 Limites Resend (Plan Gratuit)

- **3000 emails/mois**
- **100 emails/jour**
- **Domaine test**: 1 email/jour par destinataire
- **Domaines custom**: Illimité (dans les limites du plan)

---

## 🔐 Sécurité

⚠️ **NE JAMAIS COMMITTER l'API Key Resend**

- L'API key doit rester dans Supabase Dashboard uniquement
- Ne pas l'ajouter dans .env.local du projet
- Si compromise: Révoquer dans Resend et en créer une nouvelle

---

## 📚 Ressources

- **Resend Docs**: https://resend.com/docs/introduction
- **Resend + Supabase**: https://resend.com/docs/send-with-supabase
- **Supabase SMTP**: https://supabase.com/docs/guides/auth/auth-smtp

---

## ✅ Checklist de Validation

- [ ] Compte Resend créé
- [ ] API Key générée et copiée
- [ ] SMTP configuré dans Supabase
- [ ] Test signup effectué
- [ ] Email de confirmation reçu
- [ ] Compte confirmé avec succès
- [ ] Login fonctionne après confirmation

---

**Status**: 🟡 En attente de configuration
**Dernière mise à jour**: 2025-12-16
