import { motion } from "framer-motion";
import { ShieldCheck, Eye, Trash2, Lock } from "lucide-react";

interface ConsentNoticeProps {
  onAccept: () => void;
}

/**
 * ⚠️ VALIDATION JURIDIQUE REQUISE
 * Ce composant implémente un consentement basique pour la collecte de données biométriques.
 * En production, une analyse d'impact (AIPD/DPIA) est obligatoire selon le RGPD Art. 35.
 */
const ConsentNotice = ({ onAccept }: ConsentNoticeProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-foreground font-display font-bold text-base">Reconnaissance faciale</h3>
          <p className="text-muted-foreground text-xs">Information et consentement</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex gap-3">
          <Eye className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-muted-foreground text-xs leading-relaxed">
            Ce système utilise votre caméra pour détecter et reconnaître votre visage.
            Seuls des <strong className="text-foreground">descripteurs numériques</strong> (empreintes mathématiques) sont stockés — aucune image brute n'est conservée.
          </p>
        </div>
        <div className="flex gap-3">
          <Lock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-muted-foreground text-xs leading-relaxed">
            Ces données sont utilisées <strong className="text-foreground">uniquement</strong> pour vérifier votre identité lors du déverrouillage.
            Elles ne sont jamais partagées avec des tiers.
          </p>
        </div>
        <div className="flex gap-3">
          <Trash2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-muted-foreground text-xs leading-relaxed">
            Vous pouvez supprimer vos données à tout moment depuis les paramètres.
            La suppression est définitive et immédiate.
          </p>
        </div>
      </div>

      <p className="text-muted-foreground/60 text-[10px] leading-relaxed mb-5">
        En cliquant « J'accepte », vous consentez au traitement de vos données biométriques
        dans le cadre décrit ci-dessus. Ce consentement peut être retiré à tout moment.
        Données traitées conformément aux principes du RGPD (Art. 5, 9).
      </p>

      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onAccept}
          className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          J'accepte et je continue
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ConsentNotice;
