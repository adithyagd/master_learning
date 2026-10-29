import React from "react";
import { getCertificatesList } from "@/actions/certificate";
import { CertificatesClient } from "@/components/admin/CertificatesClient";

export default async function AdminCertificatesApprovedPage() {
  const res = await getCertificatesList("APPROVED");

  const counts = res.data?.counts || {
    pending: 0,
    approved: 0,
    issued: 0,
    rejected: 0,
    total: 0,
  };

  const candidates = res.data?.candidates || [];

  return (
    <CertificatesClient
      initialTab="approved"
      counts={counts}
      candidates={candidates}
    />
  );
}
