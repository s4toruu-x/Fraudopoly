// Who made the card pictures. Most of their licences ask for this credit, so a
// picture from someone else gets a line here too.
export interface PictureCredit {
  name: string;
  artist: string;
  license: string;
  /** Public domain pictures have no licence to link to */
  licenseUrl?: string;
  source: string;
}

export const PICTURE_CREDITS: PictureCredit[] = [
  {"name":"Tyrannosaurus","artist":"Tyrannohotep","license":"CC BY 4.0","licenseUrl":"https://creativecommons.org/licenses/by/4.0","source":"https://commons.wikimedia.org/wiki/File:Tyrannosaurus_Versus_Triceratops.jpg"},
  {"name":"Spinosaurus","artist":"MakairodonX","license":"CC BY 4.0","licenseUrl":"https://creativecommons.org/licenses/by/4.0","source":"https://commons.wikimedia.org/wiki/File:Spinosaurus_mirabilis_illustration.jpg"},
  {"name":"Argentinosaurus","artist":"MathKnight and Zachi Evenor","license":"CC BY-SA 4.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/4.0","source":"https://commons.wikimedia.org/wiki/File:Argentinosaurus-at-WIS.jpg"},
  {"name":"Velociraptor","artist":"Dragos Andrei","license":"CC BY-SA 4.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/4.0","source":"https://commons.wikimedia.org/wiki/File:Velociraptor_Mongoliensis_Painting.jpg"},
  {"name":"Triceratops","artist":"ABelov2014","license":"CC BY 3.0","licenseUrl":"https://creativecommons.org/licenses/by/3.0","source":"https://commons.wikimedia.org/wiki/File:Triceratops_and_Leptoceratops.jpg"},
  {"name":"Giganotosaurus","artist":"チャンネルD - ChDinosaurs","license":"CC BY-SA 4.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/4.0","source":"https://commons.wikimedia.org/wiki/File:Giganotosaurus_carolinii_colored_pencil_drawing.jpg"},
  {"name":"Allosaurus","artist":"Charles Robert Knight","license":"Public domain","source":"https://commons.wikimedia.org/wiki/File:Allosaurus_eating.jpg"},
  {"name":"Carnotaurus","artist":"Lida Xing and Yi Liu","license":"CC BY 2.5","licenseUrl":"https://creativecommons.org/licenses/by/2.5","source":"https://commons.wikimedia.org/wiki/File:Carnotaurus_life_restoration_(mirrored).jpg"},
  {"name":"Ankylosaurus","artist":"Mariana Ruiz Villarreal","license":"Public domain","source":"https://commons.wikimedia.org/wiki/File:Ankylosaurus_dinosaur.png"},
  {"name":"Brachiosaurus","artist":"Nobu Tamura","license":"CC BY-SA 4.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/4.0","source":"https://commons.wikimedia.org/wiki/File:Brachiosaurus_NT_new.jpg"},
  {"name":"Stegosaurus","artist":"ABelov2014","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0","source":"https://commons.wikimedia.org/wiki/File:Stegosaurus_and_Coelurus.jpg"},
  {"name":"Diplodocus","artist":"Charles Robert Knight","license":"Public domain","source":"https://commons.wikimedia.org/wiki/File:Diplodocus_cknight.jpg"},
  {"name":"Parasaurolophus","artist":"ABelov2014","license":"CC BY 3.0","licenseUrl":"https://creativecommons.org/licenses/by/3.0","source":"https://commons.wikimedia.org/wiki/File:Teratophoneus_chasing_Parasaurolophus.jpg"},
  {"name":"Utahraptor","artist":"Emily Willoughby","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0","source":"https://commons.wikimedia.org/wiki/File:Utahraptor_updated.png"},
  {"name":"Baryonyx","artist":"Андрей Белов","license":"CC BY 3.0","licenseUrl":"https://creativecommons.org/licenses/by/3.0","source":"https://commons.wikimedia.org/wiki/File:Baryonyx_life_restoration.jpg"},
  {"name":"Pachycephalosaurus","artist":"Ryan Steiskal","license":"CC BY 2.5","licenseUrl":"https://creativecommons.org/licenses/by/2.5","source":"https://commons.wikimedia.org/wiki/File:Pachycephalosaurus.png"},
  {"name":"Iguanodon","artist":"Sauroarchive","license":"CC BY 4.0","licenseUrl":"https://creativecommons.org/licenses/by/4.0","source":"https://commons.wikimedia.org/wiki/File:Iguanodon_paleoart_2025.png"},
  {"name":"Compsognathus","artist":"Trecătorul răcit","license":"CC BY-SA 4.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/4.0","source":"https://commons.wikimedia.org/wiki/File:Compsognathus_restituire_ipotetic%C4%83.jpg"},
  {"name":"Gallimimus","artist":"PaleoNeolitic","license":"CC BY 4.0","licenseUrl":"https://creativecommons.org/licenses/by/4.0","source":"https://commons.wikimedia.org/wiki/File:Gallimimus_Restoration.png"},
  {"name":"Dilophosaurus","artist":"Heather Kyoht Luterman","license":"CC BY 2.5","licenseUrl":"https://creativecommons.org/licenses/by/2.5","source":"https://commons.wikimedia.org/wiki/File:Dilophosaurus_wetherilli_cropped.jpg"},
  {"name":"Protoceratops","artist":"AntoninJury","license":"CC BY-SA 4.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/4.0","source":"https://commons.wikimedia.org/wiki/File:Protoceratops.jpg"},
  {"name":"Oviraptor","artist":"PaleoNeolitic","license":"CC BY 4.0","licenseUrl":"https://creativecommons.org/licenses/by/4.0","source":"https://commons.wikimedia.org/wiki/File:Oviraptor_Restoration.png"},
  {"name":"Maiasaura","artist":"ABelov2014","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0","source":"https://commons.wikimedia.org/wiki/File:Einiosaurus_and_Maiasaura.jpg"},
  {"name":"Coelophysis","artist":"ABelov2014","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0","source":"https://commons.wikimedia.org/wiki/File:Postosuchus,_Coelophysis,_and_Placerias.jpg"},
  {"name":"Therizinosaurus","artist":"Johnson Mortimer","license":"CC BY 3.0","licenseUrl":"https://creativecommons.org/licenses/by/3.0","source":"https://commons.wikimedia.org/wiki/File:Therizinosaurus_6_by_johnson_mortimer-da8hjx0.jpg"},
  {"name":"Yutyrannus","artist":"Lai bou shi","license":"CC BY 4.0","licenseUrl":"https://creativecommons.org/licenses/by/4.0","source":"https://commons.wikimedia.org/wiki/File:Yutyrannus_hunting_Dongbeititan.png"},
  {"name":"Deinonychus","artist":"DmytroLeontyev","license":"CC BY-SA 4.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/4.0","source":"https://commons.wikimedia.org/wiki/File:Deinonychus_DL.jpg"},
  {"name":"Tarbosaurus","artist":"Durbed","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0","source":"https://commons.wikimedia.org/wiki/File:Tarbosaurus_and_Saurolophus_by_durbed.jpg"},
  {"name":"Cryolophosaurus","artist":"Fabio Pastori","license":"CC BY-SA 4.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/4.0","source":"https://commons.wikimedia.org/wiki/File:Life_Restoration_of_Cryolophosaurus_ellioti_pair.jpg"},
  {"name":"Albertosaurus","artist":"ABelov2014","license":"CC BY 3.0","licenseUrl":"https://creativecommons.org/licenses/by/3.0","source":"https://commons.wikimedia.org/wiki/File:Albertosaurus_confronting_Pachyrhinosaurus.jpg"},
  {"name":"Deinocheirus","artist":"Johnson Mortimer","license":"CC BY 3.0","licenseUrl":"https://creativecommons.org/licenses/by/3.0","source":"https://commons.wikimedia.org/wiki/File:Deinocheirus_by_johnson_mortimer-d9npnef.jpg"},
  {"name":"Styracosaurus","artist":"LadyofHats","license":"Public domain","source":"https://commons.wikimedia.org/wiki/File:Styracosaurus_dinosaur.png"},
  {"name":"Microraptor","artist":"Lai bou shi","license":"CC BY 4.0","licenseUrl":"https://creativecommons.org/licenses/by/4.0","source":"https://commons.wikimedia.org/wiki/File:Microraptor_hunting_Nemicolopterus.png"},
  {"name":"Majungasaurus","artist":"ДиБгд","license":"CC BY-SA 3.0","licenseUrl":"http://creativecommons.org/licenses/by-sa/3.0/","source":"https://commons.wikimedia.org/wiki/File:Majungasaurus_DB.jpg"},
  {"name":"Ceratosaurus","artist":"Oleg Kuznetsov","license":"CC BY-SA 4.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/4.0","source":"https://commons.wikimedia.org/wiki/File:Ceratosaurus_nasicornis_walking.jpg"},
  {"name":"Corythosaurus","artist":"ABelov2014","license":"CC BY 3.0","licenseUrl":"https://creativecommons.org/licenses/by/3.0","source":"https://commons.wikimedia.org/wiki/File:Gorgosaurus_chasing_Corythosaurus.jpg"},
  {"name":"Edmontosaurus","artist":"Durbed","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0","source":"https://commons.wikimedia.org/wiki/File:Edmontosaurus_pounding_Albertosaurus_by_durbed.jpg"},
  {"name":"Kentrosaurus","artist":"Foolp","license":"CC BY-SA 4.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/4.0","source":"https://commons.wikimedia.org/wiki/File:KentrosaurusNV.jpg"},
  {"name":"Mamenchisaurus","artist":"Steveoc 86","license":"CC BY-SA 2.5","licenseUrl":"https://creativecommons.org/licenses/by-sa/2.5","source":"https://commons.wikimedia.org/wiki/File:Mamenchisaurus_youngi_steveoc_86.jpg"},
  {"name":"Psittacosaurus","artist":"PaleoEquii","license":"CC BY-SA 4.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/4.0","source":"https://commons.wikimedia.org/wiki/File:Psittacosaurus_mongoliensis_reconstruction.jpg"},
];
