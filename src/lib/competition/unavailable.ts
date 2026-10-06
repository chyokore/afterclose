import type { LiveObservation } from "./model";
export function unavailableObservation(failure: LiveObservation["failure"] = "configuration"): LiveObservation {
  return { mode:"live",state:"unavailable",failure,token:null,quote:null,market:null,discovery:"UNVERIFIED",searchCompany:null,audits:[],chains:null,
    issuer:{availability:"unavailable",value:null,observedAtMs:null,source:"https://app.ondo.finance/assets/nvdaon",effectiveAtMs:null,validUntilMs:null,verification:"unverified"} };
}
