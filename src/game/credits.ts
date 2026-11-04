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
];
