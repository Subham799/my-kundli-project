// HousePanel.jsx — 12 Houses Complete Predictions + Medical + Bhavat Bhavam
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PLANET_META } from "../../constants";

const HI = { fontFamily:"'Noto Sans Devanagari',sans-serif" };
const C = { amber:"#F59E0B",cyan:"#22D3EE",rose:"#FB7185",green:"#4ADE80",purple:"#C084FC",indigo:"#818CF8",orange:"#FB923C",teal:"#2DD4BF",red:"#EF4444",yellow:"#FCD34D",pink:"#F472B6",blue:"#60A5FA" };
const PH = {Su:"सूर्य",Mo:"चंद्र",Ma:"मंगल",Me:"बुध",Ju:"गुरु",Ve:"शुक्र",Sa:"शनि",Ra:"राहु",Ke:"केतु"};

const HOUSE_DATA = {
  1: {
    title:"लग्न — व्यक्तित्व, स्वास्थ्य, जीवन दिशा",icon:"👤",color:"#22D3EE",cat:"केंद्र",
    karak:"Sun",karakH:"सूर्य",
    meaning:"आप कौन हैं, आपका शरीर, स्वास्थ्य और जीवन की दिशा",
    strong:"मजबूत लग्न = स्वस्थ, आत्मविश्वासी, दीर्घायु",
    weak:"कमजोर लग्न = बीमार, अनिश्चित, छोटी उम्र की परेशानियां",
    health:"सिर, मस्तिष्क, चेहरा, शरीर का ऊपरी हिस्सा",
    planets:{
      Su:"✅ सूर्य — लग्न में उत्तम! नेतृत्व, सरकारी लाभ, पिता से संबंध अच्छा",
      Mo:"चंद्र — भावनात्मक, जनता से जुड़ाव, माता का प्रभाव प्रबल",
      Ma:"मंगल — साहसी, ऊर्जावान, दुर्घटना का भय, मंगलिक दोष",
      Me:"बुध — बुद्धिमान, वाणी कुशल, व्यापार में तेज",
      Ju:"✅ गुरु — ज्ञानी, धार्मिक, सम्मानित, मोटापे की संभावना",
      Ve:"शुक्र — सुंदर, कलाप्रिय, विलासी, स्त्री सुख",
      Sa:"शनि — गंभीर, मेहनती, देरी से सफलता, शरीर दुबला",
      Ra:"राहु — रहस्यमयी, महत्वाकांक्षी, विचित्र बीमारियां",
      Ke:"केतु — वैरागी, आध्यात्मिक, सिर दर्द, पिछले जन्म का प्रभाव",
    },
    bhavat:"7वां भाव (लग्न का लग्न) — लग्न की ताकत का असर जीवनसाथी पर"
  },
  2: {
    title:"धन भाव — संपत्ति, परिवार, वाणी",icon:"💰",color:"#F59E0B",cat:"मारक",
    karak:"Jupiter",karakH:"गुरु",
    meaning:"परिवार, बचपन, वाणी, आंखें (दाईं), संचित धन",
    strong:"✅ अच्छी वाणी, परिवार सुखी, धन संचय",
    weak:"कटु वाणी, परिवार में विवाद, धन खर्च",
    health:"दाईं आंख, गला, दांत, नाक का ऊपरी हिस्सा",
    planets:{
      Su:"✅ सूर्य — पिता से संपत्ति, अधिकारपूर्ण वाणी, सरकारी धन",
      Mo:"चंद्र — माता से धन, भावुक वाणी, दूध-जल से व्यापार",
      Ma:"⚠️ मंगल — कटु वाणी, दुर्घटना में धन हानि, परिवार में झगड़े",
      Me:"✅ बुध — व्यापारिक वाणी, लेखन से धन, बड़ा परिवार",
      Ju:"✅✅ गुरु — अति शुभ! परिवार समृद्ध, मधुर वाणी, धन का खजाना",
      Ve:"✅ शुक्र — सुंदर वाणी, परिवार में सुख, स्त्री से धन",
      Sa:"शनि — कम बोलना, कठोर वाणी, देरी से धन",
      Ra:"राहु — झूठ बोलना, असामान्य परिवार, विदेशी धन",
      Ke:"केतु — कम बोलना, रहस्यमय परिवार, धन अनिश्चित",
    },
    bhavat:"8वां भाव (2रे का 7वां) — परिवार का परिवर्तन, गुप्त धन"
  },
  3: {
    title:"पराक्रम भाव — साहस, भाई-बहन, मीडिया",icon:"⚔️",color:"#FB923C",cat:"उपचय",
    karak:"Mars",karakH:"मंगल",
    meaning:"साहस, भाई-बहन, लघु यात्रा, हाथ, लेखन, मीडिया",
    strong:"✅ साहसी, भाई-बहन से सहयोग, यात्राओं से लाभ",
    weak:"डरपोक, भाई से विवाद, कंधे-हाथ में चोट",
    health:"कंधे, हाथ, कान, गर्दन का निचला हिस्सा",
    planets:{
      Su:"सूर्य — भाई से प्रतिस्पर्धा, यात्राओं में थकान",
      Mo:"चंद्र — बहन से स्नेह, पानी से यात्रा, अस्थिर साहस",
      Ma:"✅✅ मंगल — अति साहसी! भाई से सहयोग, सेना/पुलिस योग",
      Me:"✅ बुध — लेखन/मीडिया से लाभ, चालाक, व्यापार यात्राएं",
      Ju:"गुरु — धार्मिक यात्राएं, भाई को ज्ञान, पर साहस थोड़ा कम",
      Ve:"शुक्र — कलात्मक यात्राएं, बहन से सुख, मनोरंजन क्षेत्र",
      Sa:"शनि — धीमा साहस, भाई से दूरी, मेहनत से यात्राएं",
      Ra:"⚠️ राहु — अत्यधिक साहस या भय, भाई से विचित्र संबंध",
      Ke:"केतु — एकांत की तलाश, भाई से अलगाव, आध्यात्मिक यात्राएं",
    },
    bhavat:"9वां भाव (3रे का 7वां) — साहस का भाग्य, धार्मिक यात्राएं"
  },
  4: {
    title:"सुख भाव — माता, गृह, संपत्ति, शिक्षा",icon:"🏠",color:"#22D3EE",cat:"केंद्र",
    karak:"Moon",karakH:"चंद्र",
    meaning:"माता, घर, जमीन, गाड़ी, स्कूली शिक्षा, मन की शांति",
    strong:"✅ सुखी घर, माता स्वस्थ, संपत्ति, मन शांत",
    weak:"घर में अशांति, माता को कष्ट, संपत्ति विवाद",
    health:"छाती, फेफड़े, हृदय (ऊपरी), दूध ग्रंथियां",
    planets:{
      Su:"सूर्य — पिता की संपत्ति, सरकारी मकान, माता से दूरी",
      Mo:"✅✅ चंद्र — अति शुभ! सुखी घर, माता से प्रेम, संपत्ति",
      Ma:"⚠️ मंगल — घर में झगड़े, माता को कष्ट, भूमि विवाद",
      Me:"बुध — शिक्षा से संपत्ति, किराये का मकान",
      Ju:"✅ गुरु — बड़ा मकान, माता धार्मिक, सुखी परिवार",
      Ve:"✅ शुक्र — सुंदर घर, गाड़ी, माता खुश",
      Sa:"शनि — देरी से मकान, किरायेदारी, माता को कष्ट",
      Ra:"राहु — विदेशी मकान, माता को अजीब बीमारी",
      Ke:"केतु — घर में आध्यात्मिक माहौल, माता से अलगाव",
    },
    bhavat:"10वां भाव (4थे का 7वां) — माता का करियर, घर का सम्मान"
  },
  5: {
    title:"संतान भाव — बुद्धि, संतान, प्रेम, शेयर",icon:"🧒",color:"#4ADE80",cat:"त्रिकोण",
    karak:"Jupiter",karakH:"गुरु",
    meaning:"संतान, बुद्धि, पूर्वजन्म पुण्य, प्रेम, सट्टा",
    strong:"✅ तीव्र बुद्धि, संतान सुख, प्रेम सफल, शेयर में लाभ",
    weak:"संतान देरी, बुद्धि का दुरुपयोग, प्रेम में दुख",
    health:"पेट, पाचन तंत्र, रीढ़ (ऊपरी), हृदय",
    planets:{
      Su:"सूर्य — पुत्र जन्म के योग, सरकारी पद, नेतृत्व बुद्धि",
      Mo:"चंद्र — पुत्री योग, कल्पनाशील बुद्धि, प्रेम में भावुकता",
      Ma:"⚠️ मंगल — संतान देरी, प्रेम में झगड़े, तेज बुद्धि पर जिद्दी",
      Me:"✅ बुध — लेखन प्रतिभा, व्यापारिक बुद्धि, शेयर में लाभ",
      Ju:"✅✅ गुरु — अति शुभ! बुद्धिमान संतान, शिक्षा में सफलता",
      Ve:"✅ शुक्र — प्रेम विवाह, कलात्मक प्रतिभा, सुंदर संतान",
      Sa:"शनि — संतान देरी, गंभीर बुद्धि, सट्टे में हानि",
      Ra:"राहु — विचित्र बुद्धि, संतान अनिश्चित, तंत्र में रुचि",
      Ke:"✅ केतु — तंत्र सिद्धि, पूर्वजन्म ज्ञान, पर संतान देरी",
    },
    bhavat:"9वां भाव (5वें का 5वां) = 9वां — भाग्य और बुद्धि का सीधा संबंध"
  },
  6: {
    title:"रोग भाव — शत्रु, कर्ज, रोग, नौकरी",icon:"⚕️",color:"#FB7185",cat:"दुष्ट",
    karak:"Mars",karakH:"मंगल",
    meaning:"रोग, शत्रु, कर्ज, नौकरी, मामा-मामी, सेवा",
    strong:"शत्रुओं पर विजय, रोग से जल्दी मुक्ति, नौकरी में सफलता",
    weak:"पुराने रोग, शत्रु शक्तिशाली, कर्ज का बोझ",
    health:"पाचन तंत्र, आंतें, गुर्दे (बाईं), कमर",
    planets:{
      Su:"सूर्य — सरकारी नौकरी, शत्रु पराजित, पर स्वास्थ्य पर ध्यान",
      Mo:"चंद्र — मानसिक रोग का भय, माता से दूरी, नौकरी में भावुकता",
      Ma:"✅ मंगल — शत्रु नाशक! नौकरी में सफल, पर कटु स्वभाव",
      Me:"बुध — कर्ज से मुक्ति, व्यापारिक शत्रु, त्वचा रोग",
      Ju:"गुरु — शत्रु अपने आप शांत, पर मोटापा, लिवर की समस्या",
      Ve:"शुक्र — स्त्री शत्रु, मधुमेह का खतरा, वैभवशाली नौकरी",
      Sa:"✅ शनि — शत्रु नाशक, कर्ज चुका देंगे, दीर्घकालिक सेवा",
      Ra:"✅✅ राहु — शत्रु खुद पस्त! सरकारी काम में सफलता",
      Ke:"✅✅ केतु — शत्रु नष्ट! रोग ठीक होते हैं",
    },
    bhavat:"12वां भाव (6ठे का 7वां) — शत्रु का अंत, रोग का खर्च"
  },
  7: {
    title:"विवाह भाव — जीवनसाथी, व्यापार, विदेश",icon:"💑",color:"#F472B6",cat:"केंद्र/मारक",
    karak:"Venus",karakH:"शुक्र",
    meaning:"विवाह, जीवनसाथी, व्यापारिक साझेदारी, विदेश यात्रा",
    strong:"✅ सुखी विवाह, अच्छा साझेदार, विदेश में सफलता",
    weak:"विवाह देरी/टूटना, साझेदारी में धोखा",
    health:"किडनी, प्रजनन अंग, कमर का निचला हिस्सा",
    planets:{
      Su:"सूर्य — जीवनसाथी अहंकारी, देरी से विवाह, सरकारी साझेदारी",
      Mo:"चंद्र — भावुक जीवनसाथी, माता जैसा स्वभाव, जल्दी विवाह",
      Ma:"⚠️ मंगल — मंगलिक दोष! झगड़ालू साथी, देरी से विवाह",
      Me:"बुध — बुद्धिमान साथी, व्यापारिक साझेदारी, लेखन से लाभ",
      Ju:"✅ गुरु — धार्मिक साथी, सुखी विवाह, साझेदारी में लाभ",
      Ve:"✅✅ शुक्र — अति शुभ! सुंदर साथी, प्रेम विवाह, साझेदारी से धन",
      Sa:"⚠️ शनि — देरी से विवाह, उम्र में बड़ा साथी, तनावपूर्ण",
      Ra:"⚠️ राहु — विचित्र साथी, विवाह में भ्रम, विदेशी से विवाह",
      Ke:"⚠️ केतु — विवाह देरी, साथी उदासीन, आध्यात्मिक रिश्ता",
    },
    bhavat:"1ला भाव (7वें का 7वां) = लग्न — जीवनसाथी की लग्न, साझेदारी का व्यक्तित्व"
  },
  8: {
    title:"आयु भाव — दीर्घायु, गुप्त ज्ञान, विरासत",icon:"🔮",color:"#C084FC",cat:"दुष्ट",
    karak:"Saturn",karakH:"शनि",
    meaning:"आयु, मृत्यु का प्रकार, विरासत, गूढ़ विद्या, दुर्घटना",
    strong:"दीर्घायु, गूढ़ शक्तियां, अचानक लाभ",
    weak:"अल्पायु का भय, दुर्घटनाएं, पुराने रोग",
    health:"गुप्त अंग, बवासीर, मलाशय, हड्डियां",
    planets:{
      Su:"सूर्य — पिता की विरासत, नेत्र रोग का भय, सरकारी दंड का भय",
      Mo:"⚠️ चंद्र — मानसिक उथल-पुथल, माता को कष्ट, पानी से भय",
      Ma:"⚠️ मंगल — दुर्घटना का उच्च खतरा, रक्त विकार, साहसी भी",
      Me:"बुध — गूढ़ विद्या में रुचि, तंत्र ज्ञान, त्वचा रोग",
      Ju:"✅ गुरु — दीर्घायु! विरासत में धन, गूढ़ज्ञान, बीमारी कम",
      Ve:"शुक्र — विरासत में संपत्ति, यौन रोग का भय, आरामदेह मृत्यु",
      Sa:"✅ शनि — बहुत दीर्घायु! कठिन जीवन पर लंबा, तपस्वी स्वभाव",
      Ra:"राहु — गूढ़ शक्ति, विचित्र मृत्यु का भय, तांत्रिक योग",
      Ke:"✅ केतु — मोक्ष का रास्ता, दीर्घायु, गूढ़ सिद्धि",
    },
    bhavat:"2रा भाव (8वें का 7वां) — मृत्यु के बाद परिवार की स्थिति"
  },
  9: {
    title:"भाग्य भाव — पिता, धर्म, उच्च शिक्षा",icon:"🙏",color:"#FCD34D",cat:"त्रिकोण",
    karak:"Jupiter",karakH:"गुरु",
    meaning:"भाग्य, पिता, धर्म, उच्च शिक्षा, गुरु, दीर्घ यात्राएं",
    strong:"✅ भाग्यशाली, पिता समृद्ध, विदेश में शिक्षा",
    weak:"भाग्य देरी से साथ देता है, पिता को कष्ट",
    health:"कूल्हे, जांघ, लिवर, पित्ताशय",
    planets:{
      Su:"✅ सूर्य — पिता से भाग्योदय, सरकारी उच्च पद, धार्मिक",
      Mo:"चंद्र — माता की तरह पिता, भावुक धर्म, विदेश यात्राएं",
      Ma:"मंगल — धार्मिक उत्साह, पिता से विवाद, भाग्य संघर्ष से",
      Me:"बुध — व्यापारिक भाग्य, धर्म में बुद्धि, लेखन से प्रसिद्धि",
      Ju:"✅✅ गुरु — अति शुभ! पुण्यात्मा, शिक्षक, बहुत भाग्यशाली",
      Ve:"✅ शुक्र — कलात्मक भाग्य, विदेश में प्रेम, ऐशोआराम",
      Sa:"शनि — देरी से भाग्य, कठिन परिश्रम से भाग्योदय",
      Ra:"राहु — भाग्य विचित्र रास्ते से, विदेश से भाग्य",
      Ke:"केतु — पूर्वजन्म का पुण्य, पर इस जन्म में भाग्य बाधित",
    },
    bhavat:"5वां भाव (9वें का 9वां) — भाग्य का भाग्य, पितामह का प्रभाव"
  },
  10: {
    title:"कर्म भाव — करियर, पद, माता, यश",icon:"🏆",color:"#60A5FA",cat:"केंद्र",
    karak:"Mercury/Sun",karakH:"बुध/सूर्य",
    meaning:"करियर, राज्य से संबंध, सम्मान, माता (4थे का 7वां), व्यवसाय",
    strong:"✅ उच्च पद, राजकीय सम्मान, करियर में सफलता",
    weak:"करियर में उतार-चढ़ाव, बदनामी का खतरा",
    health:"घुटने, हड्डियां (निचली), जोड़",
    planets:{
      Su:"✅✅ सूर्य — अति शुभ! सरकारी पद, राजकीय सम्मान, नेतृत्व",
      Mo:"चंद्र — जनता से जुड़ा करियर, राजनीति, होटल/फूड व्यवसाय",
      Ma:"✅ मंगल — तकनीक/सेना/पुलिस करियर, ऊर्जावान",
      Me:"✅ बुध — व्यापार/लेखन/मीडिया करियर, बुद्धिजीवी",
      Ju:"✅ गुरु — शिक्षा/धर्म/कानून करियर, सम्मानित",
      Ve:"✅ शुक्र — कला/मनोरंजन/फैशन करियर, आरामदेह पद",
      Sa:"⚠️ शनि — कठिन करियर, मजदूरी के बाद उच्च पद",
      Ra:"⚠️ राहु — विचित्र करियर, राजनीति में उठापटक",
      Ke:"⚠️ केतु — करियर बदलता रहता है, आध्यात्मिक पेशा",
    },
    bhavat:"4था भाव (10वें का 7वां) = 4थे का दूसरा अर्थ — पिता का घर, करियर की नींव"
  },
  11: {
    title:"लाभ भाव — आय, मित्र, बड़े सपने",icon:"🌟",color:"#4ADE80",cat:"उपचय",
    karak:"Jupiter",karakH:"गुरु",
    meaning:"आय, मित्र, बड़े भाई, इच्छापूर्ति, नेटवर्क",
    strong:"✅✅ उत्तम — हर इच्छा पूरी, आय अच्छी, मित्र सहायक",
    weak:"आय अनियमित, मित्र धोखेबाज",
    health:"पैर की पिंडली, टखना, बाईं बांह",
    planets:{
      Su:"सूर्य — सरकारी आय, पिता से लाभ, अहंकारी मित्र",
      Mo:"चंद्र — जनता से आय, भावुक मित्र, माता से लाभ",
      Ma:"✅ मंगल — साहस से आय, भाई-मित्र से लाभ, ऊर्जावान नेटवर्क",
      Me:"✅ बुध — व्यापार से आय, बुद्धिमान मित्र, मीडिया नेटवर्क",
      Ju:"✅✅ गुरु — धन की वर्षा! बड़े लोगों से मित्रता, हर इच्छा पूरी",
      Ve:"✅ शुक्र — कला से आय, स्त्री मित्र, विलासिता",
      Sa:"शनि — देरी से आय, बुजुर्ग मित्र, मेहनत से लाभ",
      Ra:"✅✅ राहु — अचानक बड़ा लाभ! विदेशी नेटवर्क",
      Ke:"केतु — अनिश्चित आय, रहस्यमय मित्र, आध्यात्मिक लाभ",
    },
    bhavat:"3रा भाव (11वें का 5वां) — आय का पराक्रम, लाभ का साहस"
  },
  12: {
    title:"व्यय भाव — खर्च, विदेश, मोक्ष",icon:"🌌",color:"#818CF8",cat:"दुष्ट",
    karak:"Saturn",karakH:"शनि",
    meaning:"खर्च, विदेश, मोक्ष, नींद, गुप्त शत्रु, अस्पताल",
    strong:"विदेश में सफलता, आध्यात्मिक उन्नति, मोक्ष",
    weak:"अनावश्यक खर्च, जेल/अस्पताल का भय",
    health:"बाईं आंख, पैर के तलवे, नींद की समस्या",
    planets:{
      Su:"सूर्य — विदेश में पद, गुप्त सरकारी काम, पिता से दूरी",
      Mo:"चंद्र — विदेश में बसना, माता से दूरी, अत्यधिक खर्च",
      Ma:"⚠️ मंगल — खून की बीमारी, दुर्घटना, विदेश में संघर्ष",
      Me:"बुध — विदेश में व्यापार, गुप्त लेखन, त्वचा रोग",
      Ju:"गुरु — विदेश में ज्ञान, आध्यात्म, पर खर्चे अधिक",
      Ve:"✅ शुक्र — विदेश में सुख, कलात्मक व्यय, बिस्तर सुख",
      Sa:"⚠️ शनि — लंबे समय अस्पताल/विदेश, कठिन खर्च",
      Ra:"✅ राहु — विदेश में बसना! धन लाभ, अजीब खर्च",
      Ke:"✅✅ केतु — मोक्ष योग! विदेश सफलता, आध्यात्मिक उन्नति",
    },
    bhavat:"6वां भाव (12वें का 7वां) — खर्च के शत्रु, विदेश में रोग"
  },
};

// Bhavat Bhavam Timing (5-step)
function BhavatBhavamBlock({chartPlanets,chartData}) {
  const [selHouse,setSelHouse]=useState(7);
  const houseLords=chartData?.houseLords||chartData?.house_lords||{};
  const EVENTS={
    1:"जीवन की नई शुरुआत, व्यक्तित्व परिवर्तन",
    2:"धन आगमन, परिवार में बदलाव",
    3:"यात्रा, मीडिया/लेखन अवसर",
    4:"मकान/जमीन की खरीद",
    5:"संतान जन्म, बुद्धि का विकास",
    6:"बीमारी से मुक्ति या शुरुआत",
    7:"विवाह/साझेदारी का समय",
    8:"अचानक परिवर्तन, विरासत",
    9:"भाग्योदय, विदेश यात्रा",
    10:"करियर में उन्नति या परिवर्तन",
    11:"बड़ा लाभ, इच्छापूर्ति",
    12:"विदेश प्रस्थान, अध्यात्म",
  };
  const HOUSE_NAMES={1:"लग्न",2:"धन",3:"भाई",4:"सुख",5:"संतान",6:"रोग",7:"विवाह",8:"आयु",9:"भाग्य",10:"कर्म",11:"लाभ",12:"व्यय"};
  const bhavesh=houseLords[selHouse];
  const bhaveshH=bhavesh&&chartPlanets?.[bhavesh]?.house;
  const bhaveshDignity=bhavesh&&chartPlanets?.[bhavesh]?.dignity||"";
  const bhavat=((selHouse*2-2)%12)+1; // correct Nth from Nth formula
  const bhavat2ndH=chartPlanets&&Object.values(chartPlanets).filter(p=>p?.house===bhavat).length>0;
  const KARAK={1:"Su",2:"Ju",3:"Ma",4:"Mo",5:"Ju",6:"Ma",7:"Ve",8:"Sa",9:"Ju",10:"Me",11:"Ju",12:"Sa"};
  const KARAK_NAME={Su:"सूर्य",Mo:"चंद्र",Ma:"मंगल",Me:"बुध",Ju:"गुरु",Ve:"शुक्र",Sa:"शनि"};
  const karak=KARAK[selHouse];
  const karakH=chartPlanets?.[karak]?.house;
  const karakDignity=chartPlanets?.[karak]?.dignity||"";
  const bhaveshStrong=bhaveshH&&[1,4,5,7,9,10].includes(bhaveshH);
  const bhaveshWeak=bhaveshH&&[6,8,12].includes(bhaveshH);
  const karakStrong=karakH&&[1,4,5,7,9,10].includes(karakH);
  const karakWeak=karakH&&[6,8,12].includes(karakH);
  const timingScore=(bhaveshStrong?2:bhaveshWeak?-2:0)+(karakStrong?2:karakWeak?-2:0);
  const timing=timingScore>=3?"✅✅ बहुत जल्दी और शुभ":timingScore>=1?"✅ सामान्य समय पर":timingScore>=-1?"⚡ परिश्रम से, थोड़ी देरी":"⚠️ विलंब — उपाय करें";
  const timingColor=timingScore>=3?C.green:timingScore>=1?C.cyan:timingScore>=-1?C.amber:C.rose;
  return <div className="p-4 rounded-2xl mb-3" style={{background:"rgba(8,12,28,.97)",border:"1px solid rgba(34,211,238,.3)"}}>
    <div className="text-[13px] font-black text-cyan-400 mb-3 flex items-center gap-2" style={HI}>
      <span className="text-[18px]">⏱️</span> भवात् भवम् — घटना समय का सूत्र
    </div>
    <div className="grid grid-cols-6 gap-1 mb-4">
      {[1,2,3,4,5,6,7,8,9,10,11,12].map(h=>
        <button key={h} onClick={()=>setSelHouse(h)}
          className="py-2 rounded-xl text-[13px] font-black transition-all"
          style={{background:h===selHouse?"rgba(34,211,238,.2)":"rgba(255,255,255,.04)",
            color:h===selHouse?C.cyan:"#475569",
            border:h===selHouse?`2px solid ${C.cyan}50`:"1px solid rgba(255,255,255,.08)"}}>
          {h}
        </button>
      )}
    </div>
    <motion.div key={selHouse} initial={{opacity:0}} animate={{opacity:1}}>
      <div className="p-3 rounded-xl mb-3" style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)"}}>
        <div className="text-[15px] font-black text-white" style={HI}>{selHouse}वें भाव ({HOUSE_NAMES[selHouse]}) की घटना:</div>
        <div className="text-[13px] text-cyan-400 mt-1" style={HI}>{EVENTS[selHouse]}</div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <div className="p-3 rounded-xl" style={{background:"rgba(34,211,238,.08)",border:"1px solid rgba(34,211,238,.2)"}}>
          <div className="text-[12px] font-bold text-cyan-400 mb-1.5" style={HI}>चरण 1 — भावेश (इस भाव का मालिक ग्रह कौन है?)</div>
          <div className="text-[13px] text-white font-black" style={HI}>
            {selHouse}वें ({HOUSE_NAMES[selHouse]}) भाव का स्वामी = <span className="text-cyan-300">{bhavesh?(PH[bhavesh]||bhavesh):"—"}</span>
            {bhaveshH?` — अभी ${bhaveshH}वें (${HOUSE_NAMES[bhaveshH]}) भाव में है`:bhavesh?" — स्थिति अज्ञात":""}
          </div>
          {bhaveshH&&<div className="text-[11px] mt-1.5" style={{color:bhaveshStrong?C.green:bhaveshWeak?C.rose:C.amber,...HI}}>
            💡 {bhavesh&&(PH[bhavesh]||bhavesh)} {bhaveshH}वें भाव में {bhaveshDignity?`(${bhaveshDignity}) `:""}→ {bhaveshStrong?`केंद्र/त्रिकोण में शक्तिशाली = जल्दी घटना होगी ✅`:bhaveshWeak?`6/8/12वें में कमजोर = देरी और कष्ट ⚠️`:`सामान्य स्थिति`}
          </div>}
        </div>
        <div className="p-3 rounded-xl" style={{background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)"}}>
          <div className="text-[12px] font-bold text-green-400 mb-1.5" style={HI}>चरण 2 — कारक (इस भाव का प्राकृतिक स्वामी ग्रह)</div>
          <div className="text-[13px] text-white font-black" style={HI}>
            {selHouse}वें भाव का कारक = <span className="text-green-300">{KARAK_NAME[karak]||karak}</span>
            {karakH?` — अभी ${karakH}वें (${HOUSE_NAMES[karakH]}) भाव में है`:""}
          </div>
          {karakH&&<div className="text-[11px] mt-1.5" style={{color:karakStrong?C.green:karakWeak?C.rose:C.amber,...HI}}>
            💡 {KARAK_NAME[karak]} {karakH}वें में {karakDignity?`(${karakDignity}) `:""}→ {karakStrong?`शुभ स्थान = ${HOUSE_NAMES[selHouse]} में शुभ फल ✅`:karakWeak?`6/8/12 में = ${HOUSE_NAMES[selHouse]} विषय में कठिनाई ⚠️`:`ठीक है, सामान्य फल`}
          </div>}
        </div>
        <div className="p-3 rounded-xl" style={{background:"rgba(192,132,252,.08)",border:"1px solid rgba(192,132,252,.2)"}}>
          <div className="text-[12px] font-bold text-purple-400 mb-1.5" style={HI}>चरण 3 — भवात् भवम् (इस भाव का भाव देखना)</div>
          <div className="text-[13px] text-white font-black" style={HI}>
            {selHouse}वें से {selHouse}वां = <span className="text-purple-400">{bhavat}वां भाव ({HOUSE_NAMES[bhavat]})</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 leading-relaxed" style={HI}>
            📖 सरल भाषा में: {selHouse}वें भाव से शुरू होकर {selHouse} कदम आगे जाओ — वह {bhavat}वां ({HOUSE_NAMES[bhavat]}) भाव आता है। यह {selHouse}वें भाव का "दर्पण" भाव है जो अतिरिक्त शक्ति या कमजोरी देता है।
          </div>
          <div className="text-[11px] mt-1.5" style={{color:bhavat2ndH?C.green:C.amber,...HI}}>
            {bhavat}वें ({HOUSE_NAMES[bhavat]}) भाव में {bhavat2ndH?"ग्रह मौजूद है — यह भाव सक्रिय है":"कोई ग्रह नहीं — इसके स्वामी की स्थिति देखें"}
          </div>
        </div>
        <div className="p-3 rounded-xl" style={{background:`${timingColor}10`,border:`1.5px solid ${timingColor}30`}}>
          <div className="text-[12px] font-bold mb-1" style={{color:timingColor,...HI}}>📊 निष्कर्ष — कब होगी घटना?</div>
          <div className="text-[15px] font-black mb-2" style={{color:timingColor,...HI}}>{timing}</div>
          <div className="text-[11px] text-slate-300 leading-relaxed" style={HI}>
            भावेश {bhavesh&&(PH[bhavesh]||bhavesh)} {bhaveshH?`${bhaveshH}वें में`:""}{bhaveshStrong?" (बली)":bhaveshWeak?" (कमजोर)":""} | कारक {KARAK_NAME[karak]} {karakH?`${karakH}वें में`:""}{karakStrong?" (बली)":karakWeak?" (कमजोर)":""} | भवात् भवम् {bhavat}वां ({HOUSE_NAMES[bhavat]}) → इन तीनों की स्थिति मिलाकर {HOUSE_NAMES[selHouse]} का समय तय होता है
          </div>
        </div>
      </div>
    </motion.div>
  </div>;
}

// Medical Astrology Complete
function MedicalBlock({chartPlanets,lagna}) {
  if(!chartPlanets) return null;
  const DISEASES=[];
  const p=chartPlanets;
  const inBad=c=>[6,8,12].includes(p[c]?.house);
  const debil=c=>/नीच/.test(p[c]?.Dignity||p[c]?.dignity||"");
  const inH=(c,h)=>p[c]?.house===h;
  const hasPlanet=(h,codes)=>codes.some(c=>p[c]?.house===h);
  // Eye problems
  if(p.Sa&&([1,7].includes(p.Sa.house)||inBad("Sa")))DISEASES.push({d:"👁️ चश्मे/आंखों की समस्या",r:"शनि की स्थिति — दाईं आंख (2रा भाव), बाईं (12वां)",c:C.orange,t:"medium"});
  if(p.Su&&inBad("Su"))DISEASES.push({d:"❤️ हृदय रोग सावधानी",r:"सूर्य 6/8/12 में — हृदय पर दबाव",c:C.rose,t:"high"});
  if(debil("Ju")||inH("Ju",6))DISEASES.push({d:"🩸 शुगर/डायबिटीज का खतरा",r:"गुरु नीच (मकर) या 6ठे में — मधुमेह संकेत",c:C.red,t:"high"});
  if(debil("Ve")||inBad("Ve"))DISEASES.push({d:"🫘 किडनी/मधुमेह संभव",r:"शुक्र नीच (कन्या) या 6/8/12 में",c:C.pink,t:"medium"});
  if(debil("Ma"))DISEASES.push({d:"💪 मांसपेशी/रक्त विकार",r:"मंगल नीच (कर्क) — शारीरिक कष्ट, रक्तचाप",c:C.orange,t:"medium"});
  if(p.Mo&&p.Ra&&p.Mo.house===p.Ra.house)DISEASES.push({d:"🧠 मानसिक अस्थिरता/अवसाद",r:"चंद्र+राहु युति — मन में भ्रम, अस्थिरता",c:C.red,t:"high"});
  if(inBad("Mo"))DISEASES.push({d:"😰 मानसिक तनाव/चिंता",r:"चंद्र 6/8/12 में — मन अशांत",c:C.purple,t:"medium"});
  if(inBad("Me"))DISEASES.push({d:"🦷 त्वचा/चर्म रोग",r:"बुध 6/8/12 या मीन में — त्वचा समस्या",c:C.yellow,t:"low"});
  if(p.Ma&&p.Sa&&p.Ma.house===p.Sa.house)DISEASES.push({d:"🦴 जोड़ों/हड्डियों का दर्द",r:"मंगल+शनि युति — हड्डी और मांसपेशी दोनों प्रभावित",c:C.amber,t:"medium"});
  if(debil("Ju")&&p.Ve&&p.Ju?.house===p.Ve?.house)DISEASES.push({d:"🍬 मधुमेह प्रबल योग",r:"गुरु नीच + शुक्र साथ — डायबिटीज का गंभीर खतरा",c:C.red,t:"high"});
  if(inH("Sa",lagna)||inH("Sa",7))DISEASES.push({d:"🦷 दांत/हड्डी कमजोर",r:"शनि लग्न/7वें में — दांत, हड्डी समस्या",c:C.amber,t:"low"});
  if(DISEASES.length===0)DISEASES.push({d:"✅ स्वास्थ्य समस्याएं सामान्य",r:"ग्रह स्थिति से कोई गंभीर रोग योग नहीं",c:C.green,t:"low"});
  const order={high:0,medium:1,low:2};
  DISEASES.sort((a,b)=>order[a.t]-order[b.t]);
  return <div>
    <div className="text-[12px] font-bold text-orange-400 mb-3 px-2" style={HI}>⚠️ ग्रह स्थिति आधारित स्वास्थ्य संकेत (ज्योतिष — चिकित्सक से परामर्श अवश्य लें)</div>
    {DISEASES.map((d,i)=><div key={i} className="p-3 rounded-xl mb-2"
      style={{background:`${d.c}08`,border:`1px solid ${d.c}25`}}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="text-[13px] font-black" style={{color:d.c,...HI}}>{d.d}</div>
          <div className="text-[12px] text-slate-400 mt-0.5" style={HI}>🪐 {d.r}</div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0"
          style={{background:d.t==="high"?"rgba(239,68,68,.2)":d.t==="medium"?"rgba(245,158,11,.2)":"rgba(74,222,128,.2)",
            color:d.t==="high"?C.red:d.t==="medium"?C.amber:C.green}}>
          {d.t==="high"?"उच्च":d.t==="medium"?"मध्यम":"सामान्य"}
        </span>
      </div>
    </div>)}
  </div>;
}

// ══════════════════════════════════════════════════
// TIMING PREDICTIONS — When events will happen
// ══════════════════════════════════════════════════
const TIMING_DATA = {
  education:{icon:"📚",title:"शिक्षा",color:"#22D3EE",
    houses:[4,5,9],karak:"Me",
    levels:[
      {pts:32,label:"उत्कृष्ट शिक्षा",effect:"उच्च शिक्षा विदेश में, डॉक्टरेट/MBA योग"},
      {pts:28,label:"अच्छी शिक्षा",effect:"स्नातक/स्नातकोत्तर, करियर में सहायक"},
      {pts:22,label:"साधारण",effect:"पढ़ाई बीच में छूट सकती है, व्यावहारिक ज्ञान अधिक"},
      {pts:0,label:"संघर्षपूर्ण",effect:"पढ़ाई में रुकावटें, alternative career अपनाएं"},
    ],
    timing:"15-22 वर्ष में मुख्य शिक्षा काल। गुरु दशा/गोचर में उच्च शिक्षा।",
    tip:"5वें+9वें भाव के अंक जोड़ें। 60+ = उत्कृष्ट। बुध की दशा में परीक्षा दें।"},
  marriage:{icon:"💑",title:"विवाह समय",color:"#F472B6",
    houses:[7,2,11],karak:"Ve",
    levels:[
      {pts:32,label:"जल्दी विवाह (22-27)",effect:"प्रेम विवाह या माता-पिता चयनित। सुखी दांपत्य।"},
      {pts:28,label:"सामान्य (24-29)",effect:"विवाह होगा, साथी अच्छा। कुछ समझौते जरूरी।"},
      {pts:22,label:"देरी (28-35)",effect:"विवाह देरी से पर होगा। 7वां कमजोर = साथी स्वास्थ्य।"},
      {pts:0,label:"विलंब/कष्ट (35+)",effect:"विवाह में बहुत देरी या तनाव। उपाय जरूरी।"},
    ],
    timing:"शुक्र/गुरु दशा में विवाह शुभ। गुरु का 7वें या 1लें भाव में गोचर = विवाह योग।",
    tip:"7वां + 11वां + 2रा भाव का योग देखें। शुक्र की स्थिति और शुक्र दशा सबसे महत्वपूर्ण।"},
  career:{icon:"💼",title:"करियर उत्थान",color:"#4ADE80",
    houses:[10,6,11],karak:"Su",
    levels:[
      {pts:35,label:"उच्च पद/व्यवसाय",effect:"IAS/IPS/CEO स्तर। खुद का व्यवसाय सफल।"},
      {pts:28,label:"अच्छा करियर",effect:"मैनेजर/अधिकारी स्तर। स्थिर नौकरी।"},
      {pts:22,label:"साधारण",effect:"नौकरी तो होगी पर उन्नति धीमी।"},
      {pts:0,label:"संघर्ष",effect:"नौकरी बदलती रहेगी। व्यापार में घाटा संभव।"},
    ],
    timing:"सूर्य/मंगल/शनि दशा में करियर निर्णायक मोड़। 30-35 वर्ष में सबसे बड़ा उत्थान।",
    tip:"10वां + 11वां भाव। दशमेश (10वें का स्वामी) की दशा में प्रमोशन। शनि दशा = मेहनत।"},
  property:{icon:"🏠",title:"संपत्ति",color:"#F59E0B",
    houses:[4,2,12],karak:"Ma",
    levels:[
      {pts:35,label:"एक से अधिक मकान",effect:"पैतृक + खुद का मकान। अचल संपत्ति में निवेश शुभ।"},
      {pts:28,label:"खुद का मकान",effect:"35-45 वर्ष में मकान योग। मंगल दशा में भूमि।"},
      {pts:22,label:"किराये पर",effect:"मकान देर से मिलेगा। किराये के मकान में लंबे समय।"},
      {pts:0,label:"संघर्ष",effect:"संपत्ति में विवाद। पैतृक मकान से वंचित।"},
    ],
    timing:"मंगल/शनि/शुक्र दशा में संपत्ति लाभ। 35-50 वर्ष सबसे अनुकूल।",
    tip:"4थे भाव + 12वां (व्यय) देखें। अगर 4था > 12वां = मकान बनेगा। मंगल बली = जल्दी।"},
  children:{icon:"👶",title:"संतान",color:"#C084FC",
    houses:[5,9,11],karak:"Ju",
    levels:[
      {pts:32,label:"संतान सुख पूर्ण",effect:"एक से अधिक बच्चे। बुद्धिमान और सफल संतान।"},
      {pts:28,label:"संतान सुख",effect:"एक-दो बच्चे। साधारण संतान सुख।"},
      {pts:22,label:"देरी",effect:"संतान देरी से। चिकित्सीय सहायता संभव।"},
      {pts:0,label:"कठिनाई",effect:"संतान में बाधा। गोद लेने का विचार करें।"},
    ],
    timing:"गुरु दशा और 5वें भाव में गुरु का गोचर = संतान का उत्तम समय।",
    tip:"5वां + 9वां + 11वां भाव। गुरु का बल। गुरु 5वें में गोचर = संतान योग।"},
  foreign:{icon:"✈️",title:"विदेश/प्रवास",color:"#818CF8",
    houses:[12,9,8],karak:"Ra",
    levels:[
      {pts:32,label:"विदेश में बसना",effect:"विदेश में स्थायी प्रवास। विदेशी नागरिकता संभव।"},
      {pts:28,label:"विदेश यात्राएं",effect:"व्यापार/शिक्षा हेतु विदेश। प्रवास संभव।"},
      {pts:22,label:"यात्राएं",effect:"विदेश यात्राएं होंगी पर बसना नहीं।"},
      {pts:0,label:"स्वदेश",effect:"विदेश जाना कठिन। देश में ही सफलता।"},
    ],
    timing:"राहु दशा + 12वें/9वें भाव में गुरु गोचर = विदेश योग। सही समय = 22-35 वर्ष।",
    tip:"12वां + 9वां + 8वां। राहु की शक्ति। 12वां मजबूत = विदेश में सफलता।"},
};

function TimingBlock({chartPlanets, chartData}) {
  const [sel, setSel] = useState("marriage");
  const avData = chartData?.enginesData?.ashtakvarga_complete?.analysis || {};
  const housePoints = chartData?.housePoints || {};
  const td = TIMING_DATA[sel];

  // Get house points from AV data if available
  const getHP = (h) => housePoints[h] || avData[`house_${h}`] || 0;
  const totalPts = td ? td.houses.reduce((s,h) => s + getHP(h), 0) : 0;
  const avgPts = td ? Math.round(totalPts / td.houses.length) : 0;

  // Find matching level
  const matchLevel = td?.levels.reduce((best, l) => avgPts >= l.pts ? l : best, td.levels[td.levels.length-1]);

  const ITEMS = Object.entries(TIMING_DATA);

  return (
    <div className="pb-4">
      {/* Selector */}
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {ITEMS.map(([k, d]) => (
          <button key={k} onClick={() => setSel(k)}
            className="py-2.5 rounded-xl text-[11px] font-black transition-all flex flex-col items-center gap-0.5"
            style={{background: k===sel ? `${d.color}20` : "rgba(255,255,255,.04)",
              color: k===sel ? d.color : "#475569",
              border: k===sel ? `2px solid ${d.color}50` : "1px solid rgba(255,255,255,.08)"}}>
            <span>{d.icon}</span>
            <span style={HI}>{d.title}</span>
          </button>
        ))}
      </div>

      {td && <motion.div key={sel} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}}>
        {/* Header */}
        <div className="p-4 rounded-2xl mb-3" style={{background:`${td.color}0F`, border:`1.5px solid ${td.color}35`}}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[28px]">{td.icon}</span>
            <div>
              <div className="text-[16px] font-black" style={{color:td.color,...HI}}>{td.title} — कब और कैसे?</div>
              <div className="text-[11px] text-slate-400" style={HI}>
                संबंधित भाव: {td.houses.map(h=>`${h}वां`).join(", ")} | कारक: {PLANET_META[td.karak]?.hindi||td.karak}
              </div>
            </div>
          </div>

          {/* Match Level highlight */}
          {matchLevel && (
            <div className="p-3 rounded-xl mt-2" style={{background:`${td.color}15`, border:`1px solid ${td.color}35`}}>
              <div className="text-[13px] font-black mb-1" style={{color:td.color,...HI}}>
                📊 इस कुंडली में: {matchLevel.label}
              </div>
              <div className="text-[12px] text-slate-200" style={HI}>{matchLevel.effect}</div>
            </div>
          )}
        </div>

        {/* All levels */}
        <div className="p-3 rounded-2xl mb-3" style={{background:"rgba(8,12,28,.9)", border:"1px solid rgba(255,255,255,.06)"}}>
          <div className="text-[11px] font-bold text-slate-500 mb-2" style={HI}>भाव बल के अनुसार फल:</div>
          {td.levels.map((l, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg mb-1"
              style={{background: l===matchLevel ? `${td.color}10` : "transparent",
                border: l===matchLevel ? `1px solid ${td.color}25` : "1px solid transparent"}}>
              <div className="w-16 flex-shrink-0">
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded"
                  style={{background:`${td.color}15`, color:td.color,...HI}}>{l.pts}+</span>
              </div>
              <div>
                <span className="text-[12px] font-bold text-white" style={HI}>{l.label}: </span>
                <span className="text-[12px] text-slate-300" style={HI}>{l.effect}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Timing tip */}
        <div className="p-3 rounded-xl mb-2" style={{background:"rgba(245,158,11,.07)", border:"1px solid rgba(245,158,11,.2)"}}>
          <div className="text-[11px] font-bold text-amber-400 mb-1" style={HI}>⏰ समय का सूत्र:</div>
          <div className="text-[12px] text-slate-200" style={HI}>{td.timing}</div>
        </div>
        <div className="p-3 rounded-xl" style={{background:"rgba(34,211,238,.06)", border:"1px solid rgba(34,211,238,.2)"}}>
          <div className="text-[11px] font-bold text-cyan-400 mb-1" style={HI}>💡 विशेष टिप्स:</div>
          <div className="text-[12px] text-slate-200" style={HI}>{td.tip}</div>
        </div>
      </motion.div>}
    </div>
  );
}

// ══════════════════════════════════════════════════
// MARRIAGE & PROPERTY DETAILED BLOCK
// ══════════════════════════════════════════════════
function MarriagePropertyBlock({chartPlanets, chartData}) {
  const [tab, setTab] = useState("marriage");
  const p = chartPlanets || {};

  // Marriage analysis
  const h7Planets = Object.entries(p).filter(([c,pl])=>pl?.house===7);
  const h2Planets = Object.entries(p).filter(([c,pl])=>pl?.house===2);
  const Ve = p.Ve, Ju = p.Ju, Mo = p.Mo, Ma = p.Ma, Sa = p.Sa, Ra = p.Ra;
  const MALEFICS = ["Ma","Sa","Ra","Ke","Su"];
  const BENEFICS = ["Ju","Ve","Mo","Me"];

  // Marriage timing indicators
  const marriageIndicators = [];
  if(Ve){
    const vH=Ve.house, vDig=Ve.Dignity||"";
    if([1,2,4,5,7,9,10,11].includes(vH)) marriageIndicators.push({s:"✅",t:`शुक्र ${vH}वें में — विवाह शुभ, ${vH===7?"प्रेम विवाह":"साथी अच्छा"}`});
    else marriageIndicators.push({s:"⚠️",t:`शुक्र ${vH}वें में — विवाह में कुछ बाधा`});
    if(/उच्च|स्वराशि/.test(vDig)) marriageIndicators.push({s:"✅✅",t:"शुक्र उच्च/स्वराशि = विलासी, सुखी दांपत्य"});
    if(/नीच/.test(vDig)) marriageIndicators.push({s:"⚠️",t:"शुक्र नीच = दांपत्य में कष्ट, साथी से मतभेद"});
  }
  if(Ju){
    const jH=Ju.house;
    if([1,5,7,9,11].includes(jH)) marriageIndicators.push({s:"✅",t:`गुरु ${jH}वें में — विवाह में गुरु का आशीर्वाद`});
    if(jH===7) marriageIndicators.push({s:"✅✅",t:"गुरु 7वें में = धार्मिक साथी, सुखी विवाह"});
  }
  const h7Malefics = h7Planets.filter(([c])=>MALEFICS.includes(c));
  const h7Benefics = h7Planets.filter(([c])=>BENEFICS.includes(c));
  if(h7Malefics.length>=2) marriageIndicators.push({s:"⚠️⚠️",t:`7वें में ${h7Malefics.map(([c])=>PLANET_META[c]?.hindi||c).join("+")} = विवाह में तनाव, देरी`});
  if(Ma?.house===7) marriageIndicators.push({s:"⚠️",t:"मंगल 7वें में = मंगलिक दोष, झगड़ालू साथी"});
  if(Sa?.house===7) marriageIndicators.push({s:"⚠️",t:"शनि 7वें में = देरी से विवाह, उम्र में बड़ा साथी"});
  if(Ra?.house===7) marriageIndicators.push({s:"⚠️",t:"राहु 7वें में = विचित्र साथी, भ्रम संभव"});

  // Spouse description
  const spouseDesc = [];
  const veSign = Ve?.Vargas?.D1?.Rashi || Ve?.rashi || "";
  if(veSign.includes("Taurus")||veSign.includes("वृषभ")) spouseDesc.push("सुंदर, मजबूत शरीर, कला-प्रेमी");
  if(veSign.includes("Libra")||veSign.includes("तुला")) spouseDesc.push("संतुलित, न्यायप्रिय, कूटनीतिज्ञ");
  if(veSign.includes("Pisces")||veSign.includes("मीन")) spouseDesc.push("भावुक, कलात्मक, आध्यात्मिक");
  if(veSign.includes("Scorpio")||veSign.includes("वृश्चिक")) spouseDesc.push("रहस्यमय, तीव्र स्वभाव, जासूसी प्रकृति");
  if(veSign.includes("Aries")||veSign.includes("मेष")) spouseDesc.push("साहसी, जल्दबाज, आत्मनिर्भर");
  if(h7Planets.length>0) {
    h7Planets.forEach(([c])=>{
      const pm=PLANET_META[c]||{};
      spouseDesc.push(`${pm.hindi||c} 7वें में = ${c==="Su"?"अहंकारी पर सक्षम":c==="Mo"?"भावुक, माता जैसा":c==="Ma"?"साहसी, जोशीला":c==="Me"?"बुद्धिमान":c==="Ju"?"धार्मिक, ज्ञानी":c==="Ve"?"सुंदर, कलाप्रिय":c==="Sa"?"गंभीर, उम्रदराज":c==="Ra"?"विचित्र, विदेशी जैसा":"उदासीन"}`);
    });
  }

  // Property analysis
  const h4=p.Ma||{},Ma4=p.Ma,Sa4=p.Sa,Mo4=p.Mo;
  const propertyIndicators = [];
  if(Ma) {
    const maDig=Ma.Dignity||"", maH=Ma.house;
    if(/उच्च/.test(maDig)) propertyIndicators.push({s:"✅✅",t:"मंगल उच्च = जल्दी और बड़ी संपत्ति"});
    if(/नीच/.test(maDig)) propertyIndicators.push({s:"⚠️",t:"मंगल नीच = संपत्ति में देरी, भूमि विवाद"});
    if(maH===4) propertyIndicators.push({s:"✅",t:"मंगल 4थे में = भूमि/मकान का प्रबल योग"});
    if(maH===8) propertyIndicators.push({s:"✅",t:"मंगल 8वें में = पैतृक/विरासत संपत्ति"});
    if([6,12].includes(maH)) propertyIndicators.push({s:"⚠️",t:`मंगल ${maH}वें में = संपत्ति खर्च या विवाद`});
  }
  if(Sa){
    const saH=Sa.house;
    if(saH===4) propertyIndicators.push({s:"⚠️",t:"शनि 4थे में = संपत्ति देर से, किराये में समय बीतेगा"});
    if([10,11].includes(saH)) propertyIndicators.push({s:"✅",t:`शनि ${saH}वें में = मेहनत के बाद स्थायी संपत्ति`});
  }
  const h4ps = Object.entries(p).filter(([c,pl])=>pl?.house===4);
  if(h4ps.length>=3) propertyIndicators.push({s:"⚠️",t:"4थे में 3+ ग्रह = संपत्ति विवाद, मकान में अशांति"});

  // Property timing
  const propTiming = [];
  if(Ma) propTiming.push(`मंगल दशा (${Ma.house}वें से) — संपत्ति का प्रमुख समय`);
  if(Sa) propTiming.push(`शनि दशा — मेहनत के बाद स्थायी संपत्ति`);
  propTiming.push("35-50 वर्ष सबसे अनुकूल — 4थे में गुरु गोचर = मकान योग");

  return (
    <div className="pb-4">
      <div className="flex gap-2 mb-4">
        {[["marriage","💑 विवाह"],["property","🏠 संपत्ति"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-black transition-all"
            style={{background:tab===k?"rgba(244,114,182,.2)":"rgba(255,255,255,.04)",
              color:tab===k?"#F472B6":"#475569",
              border:tab===k?"2px solid rgba(244,114,182,.4)":"1px solid rgba(255,255,255,.08)",...HI}}>
            {l}
          </button>
        ))}
      </div>

      {tab==="marriage" && (
        <div>
          {/* Marriage indicators */}
          <div className="p-4 rounded-2xl mb-3" style={{background:"rgba(244,114,182,.07)", border:"1.5px solid rgba(244,114,182,.25)"}}>
            <div className="text-[14px] font-black text-pink-400 mb-3" style={HI}>💑 विवाह योग विश्लेषण</div>
            {marriageIndicators.length > 0
              ? marriageIndicators.map((ind,i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-[14px] flex-shrink-0">{ind.s}</span>
                    <span className="text-[12px] text-slate-200" style={HI}>{ind.t}</span>
                  </div>
                ))
              : <div className="text-[12px] text-slate-400" style={HI}>ग्रह डेटा उपलब्ध नहीं</div>}
          </div>

          {/* Spouse description */}
          {spouseDesc.length > 0 && (
            <div className="p-4 rounded-2xl mb-3" style={{background:"rgba(192,132,252,.07)", border:"1px solid rgba(192,132,252,.25)"}}>
              <div className="text-[13px] font-black text-purple-400 mb-2" style={HI}>👤 जीवनसाथी का स्वभाव:</div>
              {spouseDesc.map((d,i) => (
                <div key={i} className="text-[12px] text-slate-200 py-1 border-b border-white/5 last:border-0" style={HI}>• {d}</div>
              ))}
            </div>
          )}

          {/* Marriage timing */}
          <div className="p-4 rounded-2xl mb-3" style={{background:"rgba(245,158,11,.07)", border:"1px solid rgba(245,158,11,.2)"}}>
            <div className="text-[13px] font-black text-amber-400 mb-2" style={HI}>⏰ विवाह का शुभ समय:</div>
            {[
              {t:"शुक्र दशा/अंतर्दशा", e:"सबसे शुभ — विशेषकर शुक्र-गुरु या गुरु-शुक्र"},
              {t:"गुरु का 7वें/1लें में गोचर", e:"विवाह का सबसे प्रबल संकेत"},
              {t:"7वें भाव का कार्यकाल", e:`7वें में ${h7Planets.length>0?h7Planets.map(([c])=>PLANET_META[c]?.hindi||c).join("+"):"कोई ग्रह नहीं"}`},
              {t:"सप्तमेश दशा", e:"7वें के स्वामी की दशा में विवाह प्रबल"},
            ].map((item,i) => (
              <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
                <span className="text-[11px] font-bold text-amber-400 flex-shrink-0 mt-0.5" style={HI}>•</span>
                <div>
                  <span className="text-[12px] font-bold text-white" style={HI}>{item.t}: </span>
                  <span className="text-[12px] text-slate-300" style={HI}>{item.e}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Compatibility rules */}
          <div className="p-4 rounded-2xl" style={{background:"rgba(34,211,238,.06)", border:"1px solid rgba(34,211,238,.2)"}}>
            <div className="text-[13px] font-black text-cyan-400 mb-2" style={HI}>🔢 कुंडली मिलान — मुख्य नियम:</div>
            {[
              "36 गुण में 18+ = विवाह शुभ | 28+ = उत्तम",
              "मंगली-मंगली = दोष cancel | अमंगली से = समस्या",
              "7वें भाव का 7वें से = 1ला भाव (साथी का व्यक्तित्व = आप)",
              "नाड़ी दोष = सबसे खतरनाक — 8 गुण हानि",
              "भकूट दोष = 7 गुण हानि — धन/आयु पर असर",
            ].map((r,i) => (
              <div key={i} className="text-[12px] text-slate-200 py-1 border-b border-white/5 last:border-0" style={HI}>• {r}</div>
            ))}
          </div>
        </div>
      )}

      {tab==="property" && (
        <div>
          {/* Property indicators */}
          <div className="p-4 rounded-2xl mb-3" style={{background:"rgba(245,158,11,.07)", border:"1.5px solid rgba(245,158,11,.25)"}}>
            <div className="text-[14px] font-black text-amber-400 mb-3" style={HI}>🏠 संपत्ति योग विश्लेषण</div>
            {propertyIndicators.length > 0
              ? propertyIndicators.map((ind,i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-[14px] flex-shrink-0">{ind.s}</span>
                    <span className="text-[12px] text-slate-200" style={HI}>{ind.t}</span>
                  </div>
                ))
              : <div className="text-[12px] text-slate-400" style={HI}>ग्रह डेटा उपलब्ध नहीं</div>}
          </div>

          {/* Property types */}
          <div className="p-4 rounded-2xl mb-3" style={{background:"rgba(74,222,128,.07)", border:"1px solid rgba(74,222,128,.2)"}}>
            <div className="text-[13px] font-black text-green-400 mb-2" style={HI}>🏡 किस तरह की संपत्ति मिलेगी:</div>
            {[
              {g:"मंगल बली",t:"भूमि/प्लॉट — फ्लैट से बेहतर जमीन"},
              {g:"शुक्र बली",t:"सुंदर घर, शहरी क्षेत्र, आरामदेह"},
              {g:"शनि बली",t:"पुराना/विरासत मकान, देरी से लेकिन टिकाऊ"},
              {g:"गुरु बली",t:"बड़ा मकान, धार्मिक/शैक्षिक क्षेत्र में"},
              {g:"राहु प्रभाव",t:"विदेश/दूर स्थान पर संपत्ति"},
              {g:"4था मजबूत",t:"माता से/मातृपक्ष से संपत्ति"},
            ].map((item,i) => {
              const isActive = Object.entries(p).some(([c,pl]) => {
                if(item.g.includes("मंगल")&&c==="Ma") return /उच्च|स्वराशि/.test(pl.Dignity||"");
                if(item.g.includes("शुक्र")&&c==="Ve") return /उच्च|स्वराशि/.test(pl.Dignity||"");
                if(item.g.includes("शनि")&&c==="Sa") return /उच्च|स्वराशि/.test(pl.Dignity||"");
                if(item.g.includes("गुरु")&&c==="Ju") return /उच्च|स्वराशि/.test(pl.Dignity||"");
                if(item.g.includes("राहु")&&c==="Ra") return [12,9].includes(pl.house||0);
                return false;
              });
              return <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0"
                style={{opacity:isActive?1:0.45}}>
                <span className="text-[12px] font-bold text-green-400 flex-shrink-0" style={HI}>{isActive?"✅":"○"}</span>
                <div>
                  <span className="text-[12px] font-bold text-white" style={HI}>{item.g}: </span>
                  <span className="text-[12px] text-slate-300" style={HI}>{item.t}</span>
                </div>
              </div>;
            })}
          </div>

          {/* Property timing */}
          <div className="p-4 rounded-2xl" style={{background:"rgba(245,158,11,.07)", border:"1px solid rgba(245,158,11,.2)"}}>
            <div className="text-[13px] font-black text-amber-400 mb-2" style={HI}>⏰ संपत्ति का शुभ समय:</div>
            {propTiming.map((t,i) => (
              <div key={i} className="text-[12px] text-slate-200 py-1 border-b border-white/5 last:border-0" style={HI}>• {t}</div>
            ))}
            <div className="mt-2 p-2.5 rounded-xl" style={{background:"rgba(34,211,238,.08)", border:"1px solid rgba(34,211,238,.2)"}}>
              <div className="text-[12px] text-cyan-300" style={HI}>
                💡 सूत्र: 4थे भाव के अंक + मंगल बल + दशमांश (D10) देखें।
                अगर 4था &gt; 28 अंक + मंगल बली = मकान जरूर बनेगा।
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main House Panel
// ══════════════════════════════════════════════════
// RELATIVES PANEL — 7 tabs: माता/पिता/भाई/पत्नी/संतान/मातृपक्ष/पितृपक्ष
// ══════════════════════════════════════════════════
const REL_TABS = [
  { k:"mata",   l:"माता",      icon:"👩",  color:"#22D3EE",  house:4,  karak:"Mo", karakName:"चंद्र" },
  { k:"pita",   l:"पिता",      icon:"👨",  color:"#F59E0B",  house:9,  karak:"Su", karakName:"सूर्य" },
  { k:"bhai",   l:"भाई-बहन",  icon:"🤝",  color:"#FB923C",  house:3,  karak:"Ma", karakName:"मंगल" },
  { k:"patni",  l:"पति/पत्नी", icon:"💑",  color:"#F472B6",  house:7,  karak:"Ve", karakName:"शुक्र" },
  { k:"santan", l:"संतान",     icon:"👶",  color:"#C084FC",  house:5,  karak:"Ju", karakName:"गुरु"  },
  { k:"matrupaksh", l:"मातृपक्ष", icon:"👵", color:"#2DD4BF", house:4, karak:"Mo", karakName:"चंद्र" },
  { k:"pitrUpaksh", l:"पितृपक्ष", icon:"👴", color:"#FCD34D", house:9, karak:"Su", karakName:"सूर्य" },
];

// Per-relative planet effects
const REL_PLANET_FX = {
  mata: {
    Su:"सूर्य — माता सरकारी/प्रभावशाली, पर माता-पुत्र दूरी संभव",
    Mo:"✅ चंद्र — माता से गहरा प्रेम, माता स्वस्थ और सुखी",
    Ma:"⚠️ मंगल — माता को शारीरिक कष्ट, घर में तनाव",
    Me:"बुध — माता बुद्धिमान, लेखक/शिक्षिका, चंचल स्वभाव",
    Ju:"✅ गुरु — माता धार्मिक, ज्ञानी, परिवार में सम्मानित",
    Ve:"शुक्र — माता सुंदर, कलाप्रिय, सुखी जीवन",
    Sa:"⚠️ शनि — माता को दीर्घकालिक कष्ट, अलगाव संभव",
    Ra:"राहु — माता का स्वास्थ्य अनिश्चित, विचित्र परिस्थितियां",
    Ke:"केतु — माता वैरागी/आध्यात्मिक, कम लगाव",
  },
  pita: {
    Su:"✅ सूर्य — पिता प्रभावशाली, सरकारी पद, सम्मानित",
    Mo:"चंद्र — पिता भावुक, माता जैसा स्वभाव, व्यापारी",
    Ma:"⚠️ मंगल — पिता साहसी पर क्रोधी, पिता से दूरी/झगड़ा",
    Me:"बुध — पिता व्यापारी, लेखक, बुद्धिजीवी",
    Ju:"✅✅ गुरु — पिता अति शुभ! धार्मिक, ज्ञानी, धनी",
    Ve:"शुक्र — पिता कलाप्रिय, सुखी, संपत्तिवान",
    Sa:"⚠️ शनि — पिता को कष्ट, पिता की उम्र ज्यादा, दूरी",
    Ra:"राहु — पिता विदेशी वातावरण में, अजीब परिस्थितियां",
    Ke:"केतु — पिता से अलगाव, आध्यात्मिक पिता, वंश में रुकावट",
  },
  bhai: {
    Su:"सूर्य — भाई अहंकारी पर शक्तिशाली, प्रतिस्पर्धा",
    Mo:"चंद्र — बहन से गहरा प्रेम, भाई भावुक, पानी से व्यापार",
    Ma:"✅✅ मंगल — भाई साहसी और सहायक, सेना/पुलिस में",
    Me:"✅ बुध — भाई-बहन बुद्धिमान, लेखक, मीडिया में",
    Ju:"गुरु — भाई-बहन धार्मिक, शिक्षित, सहायक",
    Ve:"✅ शुक्र — बहन से विशेष प्रेम, कलाप्रिय भाई-बहन",
    Sa:"⚠️ शनि — भाई-बहन से दूरी, देरी से सहयोग",
    Ra:"राहु — भाई-बहन से विचित्र संबंध, विदेश में",
    Ke:"केतु — भाई-बहन से अलगाव, कम संबंध",
  },
  patni: {
    Su:"सूर्य — जीवनसाथी अहंकारी/प्रभावशाली, देरी से विवाह",
    Mo:"चंद्र — जीवनसाथी भावुक, माता जैसा/जैसी, सुंदर",
    Ma:"⚠️ मंगल — मंगलिक दोष! साथी आक्रामक, विवाद संभव",
    Me:"✅ बुध — बुद्धिमान साथी, व्यापारी, मीडिया में",
    Ju:"✅ गुरु — धार्मिक साथी, सुखी विवाह, धनी",
    Ve:"✅✅ शुक्र — अति शुभ! सुंदर और प्रेमी साथी",
    Sa:"⚠️ शनि — उम्र में बड़ा साथी, तनाव, देरी से विवाह",
    Ra:"⚠️ राहु — विचित्र या विदेशी साथी, भ्रम",
    Ke:"⚠️ केतु — साथी उदासीन, आध्यात्मिक, विवाह देरी",
  },
  santan: {
    Su:"सूर्य — पुत्र जन्म योग, संतान नेता/सरकारी पद में",
    Mo:"चंद्र — पुत्री योग, संतान भावुक, जल व्यापार",
    Ma:"⚠️ मंगल — संतान देरी, संतान साहसी पर जिद्दी",
    Me:"✅ बुध — बुद्धिमान संतान, लेखक, व्यापारी",
    Ju:"✅✅ गुरु — अति शुभ! धार्मिक व बुद्धिमान संतान",
    Ve:"✅ शुक्र — संतान सुंदर, कलाप्रिय, सुखी",
    Sa:"शनि — संतान देरी, गंभीर स्वभाव, कठिन जीवन",
    Ra:"राहु — संतान विचित्र, विदेश में सफलता",
    Ke:"केतु — संतान आध्यात्मिक, देरी संभव",
  },
  matrupaksh: {
    Su:"सूर्य — ननिहाल में सरकारी लोग, प्रभावशाली परिवार",
    Mo:"✅ चंद्र — मातृपक्ष से गहरा भावनात्मक जुड़ाव",
    Ma:"⚠️ मंगल — मामा-मामी से संघर्ष या दूरी",
    Me:"बुध — मामा व्यापारी/शिक्षित, मातृपक्ष से सहयोग",
    Ju:"✅ गुरु — मातृपक्ष धार्मिक व समृद्ध",
    Ve:"शुक्र — मातृपक्ष में सुख-संपत्ति",
    Sa:"⚠️ शनि — मामा-मामी से दूरी, संबंध ठंडे",
    Ra:"राहु — मातृपक्ष में विचित्र घटनाएं",
    Ke:"केतु — मातृपक्ष से अलगाव, कम संपर्क",
  },
  pitrUpaksh: {
    Su:"✅ सूर्य — पितृपक्ष शक्तिशाली, दादा-दादी से धन",
    Mo:"चंद्र — दादा-दादी भावुक, पानी से व्यापार",
    Ma:"⚠️ मंगल — पितृपक्ष से झगड़े, पैतृक संपत्ति विवाद",
    Me:"बुध — दादा व्यापारी, पितृपक्ष शिक्षित",
    Ju:"✅ गुरु — दादा-दादी धार्मिक, पितृपक्ष से आशीर्वाद",
    Ve:"शुक्र — पितृपक्ष में संपत्ति, सुखी परिवार",
    Sa:"शनि — दादा दीर्घायु, पितृपक्ष से मेहनत मिलती है",
    Ra:"राहु — पितृपक्ष में विदेशी संबंध या अजीब घटनाएं",
    Ke:"केतु — पूर्वज आध्यात्मिक, पितृ ऋण होने की संभावना",
  },
};

// Relative health & longevity details
const REL_LONGEVITY = {
  mata:  { house:4,  lord:"Mo", icon:"👩", strong:"माता दीर्घायु, स्वस्थ, सुखी",  weak:"माता का स्वास्थ्य कमजोर या कम आयु" },
  pita:  { house:9,  lord:"Su", icon:"👨", strong:"पिता दीर्घायु, समृद्ध",         weak:"पिता को कष्ट, कम आयु की संभावना" },
  bhai:  { house:3,  lord:"Ma", icon:"🤝", strong:"भाई-बहन सुखी, सहायक",           weak:"भाई-बहन से दूरी या कष्ट" },
  patni: { house:7,  lord:"Ve", icon:"💑", strong:"जीवनसाथी दीर्घायु, स्वस्थ",    weak:"जीवनसाथी के स्वास्थ्य पर ध्यान दें" },
  santan:{ house:5,  lord:"Ju", icon:"👶", strong:"संतान दीर्घायु, सफल जीवन",     weak:"संतान को बचपन में कष्ट संभव" },
  matrupaksh:{ house:6, lord:"Mo", icon:"👵", strong:"मामा-मामी सुखी",             weak:"मामा-मामी को कष्ट, संबंध ठंडे" },
  pitrUpaksh:{ house:9, lord:"Su", icon:"👴", strong:"दादा-दादी दीर्घायु, धनी",   weak:"पितृपक्ष को कष्ट, पितृ ऋण संभव" },
};

// Remedies per relative
const REL_REMEDIES = {
  mata:      ["सोमवार व्रत — चंद्र माता का कारक","गाय माता की सेवा","चांदी का दान","माता के पैर छूकर आशीर्वाद लें","कहो: 'ॐ श्रीं ह्रीं क्लीं चंद्राय नमः'"],
  pita:      ["रविवार व्रत — सूर्य पिता का कारक","तांबे के बर्तन में जल अर्पण","गेहूं/गुड़ का दान","पिता की सेवा सर्वोपरि","आदित्य हृदयम पाठ"],
  bhai:      ["मंगलवार व्रत — मंगल भाई का कारक","हनुमान चालीसा","लाल वस्तुओं का दान","भाई-बहन के साथ सात्विक भोजन","'ॐ अं अंगारकाय नमः'"],
  patni:     ["शुक्रवार व्रत — शुक्र जीवनसाथी का कारक","सफेद फूल और मिठाई का दान","माँ दुर्गा की आराधना","विवाह पूर्व कुंडली मिलान अनिवार्य","ॐ शुं शुक्राय नमः"],
  santan:    ["गुरुवार व्रत — गुरु संतान का कारक","केले और पुखराज का दान","संतान प्राप्ति के लिए संतान गोपाल मंत्र","गर्भाधान संस्कार करवाएं","ॐ गुं गुरवे नमः"],
  matrupaksh:["चंद्र शांति पूजा","सोमवार व्रत","चांदी का कड़ा पहनें","नाना-नानी, मामा-मामी की सेवा","दूध और चावल का दान"],
  pitrUpaksh:["पितृ पक्ष में श्राद्ध/तर्पण अवश्य करें","सूर्य को जल अर्पण रोज सुबह","गाय को चारा खिलाएं","पूर्वजों के नाम दान-पुण्य","नवग्रह पूजा विशेषकर सूर्य की"],
};

function RelativesBlock({chartPlanets, chartData}) {
  const [relTab, setRelTab] = useState("mata");
  const p = chartPlanets || {};
  const rt = REL_TABS.find(t => t.k === relTab) || REL_TABS[0];
  const housePlanets = Object.entries(p).filter(([c, pd]) => pd?.house === rt.house);
  const karakPlanet = p[rt.karak];
  const fxMap = REL_PLANET_FX[relTab] || {};
  const longevity = REL_LONGEVITY[relTab] || {};
  const remedies = REL_REMEDIES[relTab] || [];

  // Strength assessment
  const karakDignity = karakPlanet?.dignity || karakPlanet?.Dignity || "";
  const karakHouse = karakPlanet?.house || 0;
  const karakStrong = /उच्च|Uchcha|स्वराशि|Swa|मित्र|Mitra/i.test(karakDignity) || [1,4,5,7,9,10].includes(karakHouse);
  const karakWeak = /नीच|Neecha|शत्रु|Shatru/i.test(karakDignity) || [6,8,12].includes(karakHouse);
  const karakNeutral = !karakStrong && !karakWeak;

  const houseHasMalefic = housePlanets.some(([c]) => ["Ma","Sa","Ra","Ke","Su"].includes(c));
  const houseHasBenefic = housePlanets.some(([c]) => ["Ju","Ve","Mo","Me"].includes(c));

  // Overall score
  let score = 50;
  if (karakStrong) score += 25;
  if (karakWeak) score -= 20;
  if (houseHasBenefic) score += 15;
  if (houseHasMalefic) score -= 10;
  score = Math.max(10, Math.min(100, score));

  const scoreColor = score >= 70 ? C.green : score >= 45 ? C.amber : C.rose;
  const scoreLabel = score >= 70 ? "उत्तम" : score >= 45 ? "मध्यम" : "कष्टकारक";

  return (
    <div className="pb-4">
      {/* Sub-tab scrollable row */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4" style={{scrollbarWidth:"none"}}>
        {REL_TABS.map(t => (
          <button key={t.k} onClick={() => setRelTab(t.k)}
            className="flex-shrink-0 flex flex-col items-center gap-0.5 py-2.5 px-3 rounded-xl transition-all"
            style={{
              background: relTab === t.k ? `${t.color}20` : "rgba(255,255,255,.04)",
              color: relTab === t.k ? t.color : "#475569",
              border: relTab === t.k ? `2px solid ${t.color}45` : "1px solid rgba(255,255,255,.07)",
            }}>
            <span className="text-lg">{t.icon}</span>
            <span className="text-[10px] font-black" style={HI}>{t.l}</span>
          </button>
        ))}
      </div>

      <motion.div key={relTab} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} className="space-y-3">

        {/* Header score card */}
        <div className="p-4 rounded-2xl border"
          style={{background:`${rt.color}0C`, borderColor:`${rt.color}35`}}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{rt.icon}</span>
            <div className="flex-1">
              <div className="text-[16px] font-black" style={{color:rt.color,...HI}}>
                {rt.l} — {longevity.house}वें भाव + {rt.karakName} ({rt.karak})
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5" style={HI}>
                कारक: {rt.karakName} | भाव: {rt.house}वाँ
              </div>
            </div>
            <div className="text-center">
              <div className="text-[20px] font-black" style={{color:scoreColor}}>{score}</div>
              <div className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{background:`${scoreColor}20`,color:scoreColor,...HI}}>{scoreLabel}</div>
            </div>
          </div>

          {/* Strength bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
              <motion.div className="h-full rounded-full"
                style={{background:scoreColor, boxShadow:`0 0 8px ${scoreColor}50`}}
                initial={{width:0}} animate={{width:`${score}%`}}
                transition={{duration:.9, ease:"easeOut"}}/>
            </div>
            <span className="text-[11px] font-black" style={{color:scoreColor}}>{score}%</span>
          </div>

          {/* Karak planet status */}
          <div className="p-3 rounded-xl"
            style={{
              background: karakStrong ? "rgba(74,222,128,.08)" : karakWeak ? "rgba(251,113,133,.08)" : "rgba(255,255,255,.04)",
              border: `1px solid ${karakStrong ? C.green : karakWeak ? C.rose : "rgba(255,255,255,.1)"}35`
            }}>
            <div className="flex items-center gap-2">
              <span className="text-[14px]">
                {karakPlanet ? (PLANET_META[rt.karak]?.symbol || rt.karak) : "—"}
              </span>
              <span className="text-[12px] font-bold" style={{color: karakStrong ? C.green : karakWeak ? C.rose : C.amber,...HI}}>
                {rt.karakName}: {karakPlanet
                  ? `${karakHouse}वें भाव में${karakDignity ? ` (${karakDignity})` : ""}`
                  : "जानकारी नहीं"}
              </span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                style={{background: karakStrong?"rgba(74,222,128,.2)":karakWeak?"rgba(251,113,133,.2)":"rgba(245,158,11,.2)",
                  color: karakStrong?C.green:karakWeak?C.rose:C.amber,...HI}}>
                {karakStrong ? "✅ बली" : karakWeak ? "⚠️ कमजोर" : "सामान्य"}
              </span>
            </div>
            <div className="mt-1.5 text-[11px]"
              style={{color: karakStrong?C.green:karakWeak?"#FDA4AF":"#94A3B8",...HI}}>
              {karakStrong ? longevity.strong : karakWeak ? longevity.weak : "सामान्य स्थिति — देखभाल जरूरी"}
            </div>
          </div>
        </div>

        {/* House planets */}
        {housePlanets.length > 0 && (
          <div className="p-3.5 rounded-2xl border"
            style={{background:"rgba(255,255,255,.03)", borderColor:"rgba(255,255,255,.1)"}}>
            <div className="text-[11px] font-bold text-slate-400 mb-2" style={HI}>
              {rt.house}वें भाव में स्थित ग्रह ({housePlanets.length}):
            </div>
            {housePlanets.map(([code, pd]) => {
              const pm = PLANET_META[code] || {};
              const fx = fxMap[code] || "";
              return (
                <div key={code} className="flex items-start gap-3 p-2.5 rounded-xl mb-1.5"
                  style={{background:`${pm.color||C.amber}08`, border:`1px solid ${pm.color||C.amber}20`}}>
                  <span className="text-xl flex-shrink-0">{pm.symbol}</span>
                  <div>
                    <div className="text-[12px] font-black" style={{color:pm.color||C.amber,...HI}}>
                      {pm.hindi||code} — {pd.house}वें भाव में
                      {pd.dignity && <span className="text-[10px] text-slate-500 ml-1">({pd.dignity})</span>}
                    </div>
                    {fx && <div className="text-[11px] text-slate-300 mt-0.5" style={HI}>{fx}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {housePlanets.length === 0 && (
          <div className="p-3 rounded-xl text-center"
            style={{background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)"}}>
            <div className="text-[12px] text-slate-500" style={HI}>
              {rt.house}वें भाव में कोई ग्रह नहीं — कारक ({rt.karakName}) की स्थिति ही निर्णायक है
            </div>
          </div>
        )}

        {/* All 9 planet effects in this house */}
        <div className="p-3.5 rounded-2xl border"
          style={{background:"rgba(8,12,28,.9)", borderColor:"rgba(255,255,255,.07)"}}>
          <div className="text-[11px] font-bold text-slate-500 mb-2" style={HI}>
            {rt.house}वें भाव में सभी ग्रहों का {rt.l} पर प्रभाव:
          </div>
          {Object.entries(fxMap).map(([code, fx]) => {
            const pm = PLANET_META[code] || {};
            const isPresent = p[code]?.house === rt.house;
            return (
              <div key={code} className="flex items-start gap-2 p-2 rounded-lg mb-1"
                style={isPresent ? {background:`${pm.color||C.amber}08`, border:`1px solid ${pm.color||C.amber}20`} : {}}>
                <span className="text-[14px] flex-shrink-0" style={{color:pm.color}}>{pm.symbol}</span>
                <div>
                  <span className="text-[11px] font-bold" style={{color:pm.color||C.amber,...HI}}>{pm.hindi||code}: </span>
                  <span className="text-[11px] text-slate-300" style={HI}>{fx}</span>
                  {isPresent && <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400" style={HI}>← इस कुंडली में</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Special relative analysis */}
        {relTab === "patni" && (
          <div className="p-3.5 rounded-2xl border"
            style={{background:"rgba(244,114,182,.07)", borderColor:"rgba(244,114,182,.25)"}}>
            <div className="text-[12px] font-bold text-pink-400 mb-2" style={HI}>💑 जीवनसाथी का व्यक्तित्व:</div>
            {[
              {label:"रूप-रंग", val: p.Ve?.house===1?"सुंदर, आकर्षक": p.Sa?.house===7?"सांवला/सांवली, गंभीर": p.Ju?.house===7?"स्थूल, हंसमुख":"सामान्य"},
              {label:"स्वभाव", val: p.Ju?.house===7?"धार्मिक, उदार": p.Ma?.house===7?"साहसी, क्रोधी": p.Me?.house===7?"बुद्धिमान, चंचल":"मिला-जुला स्वभाव"},
              {label:"पेशा", val: p.Su?.house===7?"सरकारी नौकरी": p.Me?.house===7?"व्यापार/लेखन": p.Ve?.house===7?"कला/फैशन":"अनुकूल पेशा"},
              {label:"विवाह समय", val: p.Ve && /उच्च|Uchcha|स्वराशि/i.test(p.Ve.dignity||"")?"22-27 वर्ष (जल्दी)": p.Sa?.house===7?"32+ वर्ष (देरी)":"25-30 वर्ष (सामान्य)"},
            ].map((item,i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                <span className="text-[11px] text-slate-500" style={HI}>{item.label}</span>
                <span className="text-[11px] font-semibold text-slate-200" style={HI}>{item.val}</span>
              </div>
            ))}
          </div>
        )}

        {relTab === "santan" && (
          <div className="p-3.5 rounded-2xl border"
            style={{background:"rgba(192,132,252,.07)", borderColor:"rgba(192,132,252,.25)"}}>
            <div className="text-[12px] font-bold text-purple-400 mb-2" style={HI}>👶 संतान विश्लेषण:</div>
            {[
              {label:"संतान संख्या", val: p.Ju && [1,5].includes(p.Ju.house)?"2-3 संतान (शुभ)": p.Sa?.house===5||p.Ma?.house===5?"देरी से — 1 संतान":"सामान्य — 1-2"},
              {label:"पहली संतान", val: p.Su?.house===5||p.Mo?.house===5?"पुत्र योग": p.Ve?.house===5||p.Mo?.house===5?"पुत्री योग":"अनिश्चित"},
              {label:"संतान का भविष्य", val: p.Ju && /उच्च|Uchcha|स्वराशि/i.test(p.Ju.dignity||"")?"उज्जवल — उच्च शिक्षा": p.Sa?.house===5?"कठिन मेहनत से":"सामान्य"},
              {label:"संतान प्राप्ति काल", val: p.Ju?.house===5?"25-28 वर्ष": p.Sa?.house===5||p.Ke?.house===5?"32-38 वर्ष":"28-32 वर्ष"},
            ].map((item,i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                <span className="text-[11px] text-slate-500" style={HI}>{item.label}</span>
                <span className="text-[11px] font-semibold text-slate-200" style={HI}>{item.val}</span>
              </div>
            ))}
          </div>
        )}

        {relTab === "pitrUpaksh" && (
          <div className="p-3.5 rounded-2xl border"
            style={{background:"rgba(252,211,77,.07)", borderColor:"rgba(252,211,77,.25)"}}>
            <div className="text-[12px] font-bold text-yellow-400 mb-2" style={HI}>👴 पितृ ऋण जांच:</div>
            {[
              {label:"पितृ दोष", val: p.Ra?.house===9||p.Ke?.house===9?"⚠️ हो सकता है — श्राद्ध करें":"✅ नहीं दिखता"},
              {label:"पैतृक संपत्ति", val: p.Su && [1,9].includes(p.Su.house)?"✅ प्राप्त होगी": p.Sa?.house===9?"देरी से":"अनिश्चित"},
              {label:"दादा-दादी से संबंध", val: p.Ju?.house===9||p.Su?.house===9?"✅ आशीर्वाद मिलेगा": p.Ke?.house===9?"रहस्यमय, दूरी":"सामान्य"},
            ].map((item,i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                <span className="text-[11px] text-slate-500" style={HI}>{item.label}</span>
                <span className="text-[11px] font-semibold text-slate-200" style={HI}>{item.val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Remedies */}
        <div className="p-3.5 rounded-2xl border"
          style={{background:"rgba(192,132,252,.06)", borderColor:"rgba(192,132,252,.2)"}}>
          <div className="text-[12px] font-bold text-purple-400 mb-2" style={HI}>
            🛡️ {rt.l} के लिए उपाय:
          </div>
          {remedies.map((r, i) => (
            <div key={i} className="text-[11px] text-slate-300 mb-1" style={HI}>• {r}</div>
          ))}
        </div>

      </motion.div>
    </div>
  );
}

export default function HousePanel({chartData}) {
  const [selH,setSelH]=useState(1);
  const pl=chartData?.planets||{};
  const lagna=chartData?.lagna??0;
  const hd=HOUSE_DATA[selH];
  const planetsInHouse=Object.entries(pl).filter(([c,p])=>p?.house===selH);
  const [tab,setTab]=useState("house");
  return <div className="pb-8">
    {/* Tab switcher */}
    <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4" style={{scrollbarWidth:"none"}}>
      {[["house","🏠 भाव"],["timing","⏰ समय"],["marriage","💑 विवाह"],["medical","🏥 रोग"],["bhavat","🔄 भवात्"],["relatives","👨‍👩‍👧 रिश्तेदार"]].map(([k,l])=>
        <button key={k} onClick={()=>setTab(k)}
          className="flex-shrink-0 py-2 px-3 rounded-xl text-[11px] font-black transition-all"
          style={{background:tab===k?"rgba(34,211,238,.2)":"rgba(255,255,255,.05)",
            color:tab===k?C.cyan:"#475569",
            border:tab===k?`2px solid ${C.cyan}40`:"1px solid rgba(255,255,255,.08)",...HI}}>
          {l}
        </button>
      )}
    </div>
    {tab==="house"&&<>
      {/* House selector */}
      <div className="grid grid-cols-6 gap-1.5 mb-4">
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(h=>{
          const hdata=HOUSE_DATA[h];
          const hasP=Object.values(pl).some(p=>p?.house===h);
          return <button key={h} onClick={()=>setSelH(h)}
            className="py-3 rounded-xl text-[13px] font-black transition-all flex flex-col items-center gap-0.5"
            style={{background:h===selH?`${hdata.color}20`:"rgba(255,255,255,.04)",
              color:h===selH?hdata.color:"#475569",
              border:h===selH?`2px solid ${hdata.color}50`:"1px solid rgba(255,255,255,.08)"}}>
            {h}
            {hasP&&<div className="w-1.5 h-1.5 rounded-full" style={{background:hdata.color}}/>}
          </button>;
        })}
      </div>
      {hd&&<motion.div key={selH} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}>
        <div className="p-4 rounded-2xl mb-3" style={{background:`${hd.color}10`,border:`1.5px solid ${hd.color}30`}}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[28px]">{hd.icon}</span>
            <div>
              <div className="text-[15px] font-black" style={{color:hd.color,...HI}}>{selH}वां — {hd.title}</div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{background:`${hd.color}20`,color:hd.color,...HI}}>{hd.cat}</span>
            </div>
          </div>
          <div className="text-[13px] text-slate-300 mb-3" style={HI}>{hd.meaning}</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl" style={{background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)"}}>
              <div className="text-[11px] font-bold text-green-400 mb-1" style={HI}>✅ मजबूत हो तो:</div>
              <div className="text-[12px] text-slate-200" style={HI}>{hd.strong}</div>
            </div>
            <div className="p-2.5 rounded-xl" style={{background:"rgba(251,113,133,.08)",border:"1px solid rgba(251,113,133,.2)"}}>
              <div className="text-[11px] font-bold text-rose-400 mb-1" style={HI}>⚠️ कमजोर हो तो:</div>
              <div className="text-[12px] text-slate-200" style={HI}>{hd.weak}</div>
            </div>
          </div>
          <div className="mt-2 p-2.5 rounded-xl" style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)"}}>
            <div className="text-[11px] font-bold text-amber-400 mb-0.5" style={HI}>🏥 स्वास्थ्य:</div>
            <div className="text-[12px] text-slate-300" style={HI}>{hd.health}</div>
          </div>
          <div className="mt-2 p-2.5 rounded-xl" style={{background:"rgba(129,140,248,.08)",border:"1px solid rgba(129,140,248,.2)"}}>
            <div className="text-[11px] font-bold text-indigo-400 mb-0.5" style={HI}>🔄 भवात् भवम्:</div>
            <div className="text-[12px] text-slate-300" style={HI}>{hd.bhavat}</div>
          </div>
        </div>
        {/* Planets currently in this house */}
        {planetsInHouse.length>0&&<div className="p-3 rounded-2xl mb-3" style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)"}}>
          <div className="text-[12px] font-bold text-slate-400 mb-2" style={HI}>इस भाव में स्थित ग्रह:</div>
          {planetsInHouse.map(([code,p])=>{
            const pm=PLANET_META[code]||{};
            const effect=hd.planets[code];
            return <div key={code} className="flex items-start gap-3 p-2.5 rounded-xl mb-1.5"
              style={{background:`${pm.color||C.amber}08`,border:`1px solid ${pm.color||C.amber}20`}}>
              <span className="text-[20px]">{pm.symbol}</span>
              <div><div className="text-[13px] font-black" style={{color:pm.color||C.amber,...HI}}>{pm.hindi||code}</div>
                {effect&&<div className="text-[12px] text-slate-300 mt-0.5" style={HI}>{effect}</div>}
              </div>
            </div>;
          })}
        </div>}
        {/* All planets effects */}
        <div className="p-3 rounded-2xl" style={{background:"rgba(8,12,28,.9)",border:"1px solid rgba(255,255,255,.06)"}}>
          <div className="text-[12px] font-bold text-slate-500 mb-2" style={HI}>सभी ग्रहों का {selH}वें भाव में फल:</div>
          {Object.entries(hd.planets).map(([code,effect])=>{
            const pm=PLANET_META[code]||{};
            const isPresent=pl[code]?.house===selH;
            return <div key={code} className={`flex items-start gap-2 p-2 rounded-lg mb-1 ${isPresent?"ring-1":""}`}
              style={isPresent?{ringColor:pm.color,background:`${pm.color}08`}:{}}>
              <span className="text-[15px] flex-shrink-0">{pm.symbol}</span>
              <div><span className="text-[12px] font-bold" style={{color:pm.color||C.amber,...HI}}>{pm.hindi||code}: </span>
                <span className="text-[12px] text-slate-300" style={HI}>{effect}</span>
                {isPresent&&<span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400" style={HI}>← इस कुंडली में</span>}
              </div>
            </div>;
          })}
        </div>
      </motion.div>}
    </>}
    {tab==="medical"&&<div className="p-4 rounded-2xl" style={{background:"rgba(8,12,28,.97)",border:"1px solid rgba(239,68,68,.2)"}}>
      <MedicalBlock chartPlanets={pl} lagna={lagna}/>
    </div>}
    {tab==="bhavat"&&<BhavatBhavamBlock chartPlanets={pl} chartData={chartData}/>}
    {tab==="timing"&&<TimingBlock chartPlanets={pl} chartData={chartData}/>}
    {tab==="marriage"&&<MarriagePropertyBlock chartPlanets={pl} chartData={chartData}/>}
    {tab==="relatives"&&<RelativesBlock chartPlanets={pl} chartData={chartData}/>}
  </div>;
}