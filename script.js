"use strict";

const STORAGE_KEY = "scouts_members_v1";

const WILAYAS = [
  "أدرار","الشلف","الأغواط","أم البواقي","باتنة","بجاية","بسكرة","بشار","البليدة","البويرة",
  "تمنراست","تبسة","تلمسان","تيارت","تيزي وزو","الجزائر","الجلفة","جيجل","سطيف","سعيدة",
  "سكيكدة","سيدي بلعباس","عنابة","قالمة","قسنطينة","المدية","مستغانم","المسيلة","معسكر","ورقلة",
  "وهران","البيض","إليزي","برج بوعريريج","بومرداس","الطارف","تندوف","تيسمسيلت","الوادي","خنشلة",
  "سوق أهراس","تيبازة","ميلة","عين الدفلى","النعامة","عين تيموشنت","غرداية","غليزان","تيميمون","برج باجي مختار",
  "أولاد جلال","بني عباس","إن صالح","إن قزام","تقرت","جانت","المغير","المنيعة"
];

const GROUP_NAME = "فوج عبد الحميد بن باديس";

const BRANCHES = ["أشبال (7-10)", "كشاف ثاني (11-12)", "كشاف أول (13-14)", "متقدم (15-18)", "جوالة (+18)", "قائد / مشرف"];

/* ---------- التخزين ---------- */
function loadMembers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}
function saveMembers(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ---------- أدوات ---------- */
function fillSelect(select, items, placeholder) {
  if (!select) return;
  select.innerHTML = "";
  const first = document.createElement("option");
  first.value = "";
  first.textContent = placeholder;
  select.appendChild(first);
  items.forEach((t, i) => {
    const o = document.createElement("option");
    o.value = t;
    o.textContent = (select.dataset.numbered ? (i + 1) + " - " : "") + t;
    select.appendChild(o);
  });
}

function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

function calcAge(dateStr) {
  const b = new Date(dateStr);
  if (isNaN(b)) return "";
  const n = new Date();
  let age = n.getFullYear() - b.getFullYear();
  const m = n.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < b.getDate())) age--;
  return age;
}

/* ---------- صفحة التسجيل ---------- */
function initRegister() {
  const form = document.getElementById("regForm");
  if (!form) return;

  fillSelect(document.getElementById("wilaya"), WILAYAS, "اختر الولاية");
  fillSelect(document.getElementById("branch"), BRANCHES, "اختر الفرع");

  /* الصورة: تُصغَّر إلى 320px وتُخزَّن كـ data URL */
  let photoData = "";
  const photoInput = document.getElementById("photo");
  const photoPreview = document.getElementById("photoPreview");
  const photoHint = document.getElementById("photoHint");
  const photoClear = document.getElementById("photoClear");

  function setPhoto(data) {
    photoData = data || "";
    photoPreview.hidden = !photoData;
    photoHint.hidden = !!photoData;
    photoClear.hidden = !photoData;
    if (photoData) photoPreview.src = photoData;
    else photoPreview.removeAttribute("src");
  }

  photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("يرجى اختيار ملف صورة");
      photoInput.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 320;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        setPhoto(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => toast("تعذّر قراءة الصورة");
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  photoClear.addEventListener("click", () => {
    photoInput.value = "";
    setPhoto("");
  });

  const birth = document.getElementById("birthDate");
  birth.max = new Date().toISOString().split("T")[0];

  const phoneRe = /^0[5-7]\d{8}$/;

  function setErr(input, msg) {
    const err = input.closest(".field").querySelector(".err");
    if (err) err.textContent = msg || "";
    input.classList.toggle("invalid", !!msg);
    return !msg;
  }

  function validate() {
    let ok = true;
    const v = id => document.getElementById(id);

    ["firstName", "lastName", "birthPlace", "group", "address"].forEach(id => {
      ok = setErr(v(id), v(id).value.trim() ? "" : "هذا الحقل مطلوب") && ok;
    });
    ["birthDate", "wilaya", "branch"].forEach(id => {
      ok = setErr(v(id), v(id).value ? "" : "هذا الحقل مطلوب") && ok;
    });

    const phone = v("phone").value.trim().replace(/\s/g, "");
    ok = setErr(v("phone"), phoneRe.test(phone) ? "" : "رقم هاتف جزائري غير صالح (مثال: 0555123456)") && ok;

    const email = v("email").value.trim();
    if (email) ok = setErr(v("email"), /^\S+@\S+\.\S+$/.test(email) ? "" : "بريد إلكتروني غير صالح") && ok;
    else setErr(v("email"), "");

    // ولي الأمر إلزامي لمن هم دون 18
    const age = calcAge(v("birthDate").value);
    if (age !== "" && age < 18) {
      ok = setErr(v("guardianName"), v("guardianName").value.trim() ? "" : "اسم ولي الأمر مطلوب") && ok;
      const gp = v("guardianPhone").value.trim().replace(/\s/g, "");
      ok = setErr(v("guardianPhone"), phoneRe.test(gp) ? "" : "رقم هاتف ولي الأمر غير صالح") && ok;
    } else {
      setErr(v("guardianName"), "");
      setErr(v("guardianPhone"), "");
    }
    return ok;
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!validate()) {
      toast("يرجى تصحيح الحقول المحددة");
      const bad = form.querySelector(".invalid");
      if (bad) bad.focus();
      return;
    }
    const g = id => document.getElementById(id).value.trim();
    const member = {
      id: Date.now(),
      firstName: g("firstName"),
      lastName: g("lastName"),
      photo: photoData,
      birthDate: g("birthDate"),
      birthPlace: g("birthPlace"),
      wilaya: g("wilaya"),
      group: GROUP_NAME,
      branch: g("branch"),
      phone: g("phone").replace(/\s/g, ""),
      email: g("email"),
      address: g("address"),
      guardianName: g("guardianName"),
      guardianPhone: g("guardianPhone").replace(/\s/g, ""),
      notes: g("notes"),
      registeredAt: new Date().toISOString()
    };

    const list = loadMembers();
    const dup = list.some(m =>
      m.firstName === member.firstName && m.lastName === member.lastName && m.birthDate === member.birthDate);
    if (dup) {
      toast("هذا العضو مسجل مسبقاً");
      return;
    }
    list.push(member);
    saveMembers(list);
    form.reset();
    toast("تم التسجيل بنجاح ✔");
    setTimeout(() => (location.href = "members.html"), 1400);
  });

  form.addEventListener("reset", () => {
    setPhoto("");
    form.querySelectorAll(".err").forEach(x => (x.textContent = ""));
    form.querySelectorAll(".invalid").forEach(x => x.classList.remove("invalid"));
  });
}

/* ---------- صفحة المسجلين ---------- */
function initMembers() {
  const tbody = document.getElementById("tbody");
  if (!tbody) return;

  const search = document.getElementById("search");
  const fBranch = document.getElementById("fBranch");
  const fWilaya = document.getElementById("fWilaya");
  fillSelect(fBranch, BRANCHES, "كل الفروع");
  fillSelect(fWilaya, WILAYAS, "كل الولايات");

  function filtered() {
    const q = search.value.trim().toLowerCase();
    return loadMembers().filter(m => {
      const text = [m.firstName, m.lastName, m.group, m.phone, m.birthPlace].join(" ").toLowerCase();
      return (!q || text.includes(q)) &&
        (!fBranch.value || m.branch === fBranch.value) &&
        (!fWilaya.value || m.wilaya === fWilaya.value);
    });
  }

  function cell(tr, text, cls) {
    const td = document.createElement("td");
    if (cls) td.className = cls;
    td.textContent = text;
    tr.appendChild(td);
    return td;
  }

  function renderStats(all) {
    document.getElementById("sTotal").textContent = all.length;
  }

  function render() {
    const all = loadMembers();
    renderStats(all);
    const list = filtered();
    tbody.innerHTML = "";
    document.getElementById("emptyMsg").style.display = list.length ? "none" : "block";
    document.getElementById("count").textContent = list.length;

    list.forEach((m, i) => {
      const tr = document.createElement("tr");
      cell(tr, i + 1);
      const tdP = document.createElement("td");
      if (m.photo) {
        const im = document.createElement("img");
        im.className = "avatar";
        im.src = m.photo;
        im.alt = "";
        tdP.appendChild(im);
      } else {
        const ph = document.createElement("div");
        ph.className = "avatar none";
        ph.textContent = "👤";
        tdP.appendChild(ph);
      }
      tr.appendChild(tdP);
      cell(tr, m.lastName + " " + m.firstName);
      cell(tr, calcAge(m.birthDate) + " سنة");
      cell(tr, m.wilaya);
      cell(tr, m.group);
      const tdB = document.createElement("td");
      const b = document.createElement("span");
      b.className = "badge";
      b.textContent = m.branch;
      tdB.appendChild(b);
      tr.appendChild(tdB);
      cell(tr, m.phone);
      cell(tr, new Date(m.registeredAt).toLocaleDateString("ar-DZ"));
      const tdA = document.createElement("td");
      tdA.className = "col-action";
      const del = document.createElement("button");
      del.className = "btn btn-danger";
      del.textContent = "حذف";
      del.addEventListener("click", () => {
        if (confirm("هل تريد حذف " + m.lastName + " " + m.firstName + " ؟")) {
          saveMembers(loadMembers().filter(x => x.id !== m.id));
          render();
          toast("تم الحذف");
        }
      });
      tdA.appendChild(del);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
  }

  [search, fBranch, fWilaya].forEach(el => el.addEventListener("input", render));

  document.getElementById("exportBtn").addEventListener("click", () => {
    const list = filtered();
    if (!list.length) return toast("لا توجد بيانات للتصدير");
    const head = ["اللقب","الاسم","تاريخ الميلاد","مكان الميلاد","الولاية","الفوج","الفرع","الهاتف","البريد","العنوان","ولي الأمر","هاتف ولي الأمر","ملاحظات","تاريخ التسجيل"];
    const esc = v => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const rows = list.map(m => [m.lastName,m.firstName,m.birthDate,m.birthPlace,m.wilaya,m.group,m.branch,m.phone,m.email,m.address,m.guardianName,m.guardianPhone,m.notes,m.registeredAt].map(esc).join(","));
    const csv = "\uFEFF" + [head.map(esc).join(","), ...rows].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "scouts-members.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById("printBtn").addEventListener("click", () => window.print());

  document.getElementById("clearBtn").addEventListener("click", () => {
    if (loadMembers().length && confirm("سيتم حذف جميع المسجلين نهائياً. هل أنت متأكد؟")) {
      saveMembers([]);
      render();
      toast("تم حذف جميع البيانات");
    }
  });

  render();
}

document.addEventListener("DOMContentLoaded", () => {
  initRegister();
  initMembers();
});