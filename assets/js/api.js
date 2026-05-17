(function () {
  "use strict";

  function resolveApiBaseUrl() {
    if (window.PROMETUDE_API_BASE_URL) {
      return window.PROMETUDE_API_BASE_URL;
    }
    var host = window.location.hostname;
    if (host === "prometude.com" || host === "www.prometude.com") {
      return "https://api.prometude.com/api/v1";
    }
    return "http://localhost:8001/api/v1";
  }

  var API_BASE_URL = resolveApiBaseUrl();

  // ── Utilitaires ─────────────────────────────────────────────────────────────

  function updateFeedback(key, message, isError) {
    var el = document.querySelector(
      '.form-feedback[data-feedback-for="' + key + '"]'
    );
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("is-error", Boolean(isError));
    el.classList.toggle("is-success", !isError && message.length > 0);
  }

  function setSubmitting(btn, label, submitting) {
    if (!btn) return;
    btn.disabled = submitting;
    btn.textContent = submitting ? "Envoi en cours..." : label;
  }

  function formatApiErrorDetail(data) {
    if (!data || data.detail == null) return null;
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail
        .map(function (err) {
          if (err && typeof err.msg === "string") {
            var loc = Array.isArray(err.loc) ? err.loc.slice(1).join(".") : "";
            return (loc ? loc + " : " : "") + err.msg;
          }
          return "";
        })
        .filter(Boolean)
        .join(" ");
    }
    return null;
  }

  async function postJSON(path, payload) {
    var response = await fetch(API_BASE_URL + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      var data = null;
      try { data = await response.json(); } catch (_) {}
      var detail =
        formatApiErrorDetail(data) || "Erreur serveur (" + response.status + ")";
      throw new Error(detail);
    }
    return response.json();
  }

  // ── Formulaire de contact (section6) ────────────────────────────────────────
  // Champs : name, email, phone, message → POST /api/v1/contact

  function buildContactPayload(form) {
    var fd = new FormData(form);
    var payload = {
      form_source: "contact",
      name: (fd.get("name") || "").toString().trim(),
      email: (fd.get("email") || "").toString().trim(),
      phone: (fd.get("phone") || "").toString().trim(),
      message: (fd.get("message") || "").toString().trim(),
    };
    if (!payload.phone) delete payload.phone;
    if (!payload.message) delete payload.message;
    return payload;
  }

  async function submitContact(form, feedbackKey) {
    var btn = form.querySelector('button[type="submit"]');
    var label = btn ? btn.textContent : "";
    updateFeedback(feedbackKey, "", false);
    setSubmitting(btn, label, true);
    try {
      await postJSON("/contact", buildContactPayload(form));
      form.reset();
      updateFeedback(
        feedbackKey,
        "Message envoyé ! Nous vous répondons rapidement.",
        false
      );
    } catch (err) {
      updateFeedback(
        feedbackKey,
        err.message ||
          "Erreur lors de l'envoi. Réessayez dans quelques instants.",
        true
      );
    } finally {
      setSubmitting(btn, label, false);
    }
  }

  // ── Formulaire d'inscription (section3 + modale) ────────────────────────────
  // Champs : name (parent), email, phone, student_name, student_level, message
  // → POST /api/v1/contact (Lead avec student_name + student_level)

  function buildInscriptionPayload(form) {
    var fd = new FormData(form);
    var payload = {
      form_source: "inscription",
      name: (fd.get("name") || "").toString().trim(),
      email: (fd.get("email") || "").toString().trim(),
      phone: (fd.get("phone") || "").toString().trim(),
      student_name: (fd.get("student_name") || "").toString().trim(),
      student_level: (fd.get("student_level") || "").toString().trim(),
      message: (fd.get("message") || "").toString().trim(),
    };
    if (!payload.phone) delete payload.phone;
    if (!payload.student_name) delete payload.student_name;
    if (!payload.student_level) delete payload.student_level;
    if (!payload.message) delete payload.message;
    return payload;
  }

  async function submitInscription(form, feedbackKey) {
    var btn = form.querySelector('button[type="submit"]');
    var label = btn ? btn.textContent : "";
    updateFeedback(feedbackKey, "", false);
    setSubmitting(btn, label, true);
    try {
      await postJSON("/contact", buildInscriptionPayload(form));
      form.reset();
      updateFeedback(
        feedbackKey,
        "Inscription reçue ! Nous vous contactons sous 24h.",
        false
      );
    } catch (err) {
      updateFeedback(
        feedbackKey,
        err.message ||
          "Erreur lors de l'inscription. Réessayez dans quelques instants.",
        true
      );
    } finally {
      setSubmitting(btn, label, false);
    }
  }

  // ── Binding ─────────────────────────────────────────────────────────────────

  function bindForms() {
    // Formulaire de contact → data-lead-form → clé "contact-<value>"
    document.querySelectorAll("form[data-lead-form]").forEach(function (form) {
      var key = "contact-" + form.getAttribute("data-lead-form");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        submitContact(form, key);
      });
    });

    // Formulaire d'inscription inline + modale → data-inscription-form
    document
      .querySelectorAll("form[data-inscription-form]")
      .forEach(function (form) {
        var key = "inscription-" + form.getAttribute("data-inscription-form");
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          submitInscription(form, key);
        });
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindForms);
  } else {
    bindForms();
  }
})();
