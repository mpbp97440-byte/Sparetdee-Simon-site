"""Apply owner-approved release links and dated editorial updates, without changing media."""
from pathlib import Path
import copy, hashlib, json, subprocess, zipfile

ROOT = Path(__file__).resolve().parents[1]
LINKS = {
    'le-bizz-cest-bon-2-0': {
        'spotify': 'https://open.spotify.com/intl-fr/album/5Dx5qdEjqFH4OIUBtP8lTp?si=Y0L33oX8RuG_7k9-1eqh6w',
        'apple': 'https://music.apple.com/us/album/le-bizz-cest-bon-2-0-single/6824945377',
        'youtube': 'https://music.youtube.com/playlist?list=OLAK5uy_m8mKZ6RUHUIn17Kr7DW6Ito9q_oxuOTak&si=cpcTlFw_Tg-05mjd',
        'deezer': 'https://link.deezer.com/s/351DiofztoXAfDAAVSqVv',
    },
    'prince-des-etoiles-remix': {
        'spotify': 'https://open.spotify.com/intl-fr/album/7yjm4wkEaKeUCmZIELM1gi?si=s-eVk7BFS2qTz-vw5RXFBg',
        'apple': 'https://music.apple.com/us/album/prince-des-%C3%A9toiles-remix-single/6818615955',
        'youtube': 'https://music.youtube.com/playlist?list=OLAK5uy_ldrXe82l9WK6BApn-LS2lS7sTaYfxxQiQ&si=cpgT2NrHQ8bLN3wm',
        'deezer': 'https://link.deezer.com/s/351D94Sl7SIsvpt0K4Lfl',
    },
    'legalize-la-kalite-remix': {
        'spotify': 'https://open.spotify.com/intl-fr/album/6uewS3oixPu3iO4gSgiarM?si=JVSRjcllT1Ge4bgJkrvp8g',
        'apple': 'https://music.apple.com/us/album/l%C3%A9galize-la-kalit%C3%A9-remix-single/6815171851',
        'youtube': 'https://music.youtube.com/playlist?list=OLAK5uy_njDfbdyrcQdX8KIVMFWYx413JS1iYLV6w&si=b6r_THVrEk_JFfdY',
        'deezer': 'https://link.deezer.com/s/351CSDjpVmJ4qn7eAyHDj',
    },
    'brainrot-society-remix': {
        'spotify': 'https://open.spotify.com/intl-fr/album/0BTdjtwV2h8z1tkD5NfvlC?si=avO-nswKSOCPLneSkuyWnQ',
        'apple': 'https://music.apple.com/us/song/brainrot-society-remix/6813404749',
        'youtube': 'https://music.youtube.com/playlist?list=OLAK5uy_kXx9w_E9SGZ9aJDXnU9egffaJYH7Qijbo&si=k7r_Up0h76kpRImw',
        'deezer': 'https://link.deezer.com/s/351CCgdeBQ0mXoX4EpgsG',
    },
    'sous-le-meme-toit': {
        'spotify': 'https://open.spotify.com/intl-fr/album/6Mf9hv60u1L3sZP585UVoM?si=aM1-c5FZS3-t3JIeDezhzA',
        'deezer': 'https://link.deezer.com/s/34qSWklejnRpkrk7octZJ',
        'youtube': 'https://music.youtube.com/playlist?list=OLAK5uy_k64HBzkuh16CdUMhxnNoFg9Fc703nBmBY&si=E1FQImMeZ_8pemJz',
        'apple': 'https://music.apple.com/fr/album/sous-le-m%C3%AAme-toit-feat-mak%C3%A9da-muse-single/6810645594',
        'tiktok': 'https://www.tiktok.com/@simonsparet',
        'facebook': 'https://www.facebook.com/Sparetdee.simon',
    },
}

def read(name):
    return json.loads((ROOT / name).read_text(encoding='utf-8'))

def save(name, data):
    (ROOT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

if __name__ == '__main__':
    backup = ROOT.parent / 'backups/v15-before-content-update-20261123.zip'
    if not backup.exists():
        backup.write_bytes(subprocess.check_output(['git', 'archive', '--format=zip', '0aedf54'], cwd=ROOT))
        with zipfile.ZipFile(backup) as archive:
            assert archive.testzip() is None
    data = read('data.json')
    baseline = json.loads(subprocess.check_output(['git', 'show', '0aedf54:data.json'], cwd=ROOT).decode('utf-8'))
    originals = {item['id']: copy.deepcopy(item) for item in baseline['tracks'] if item.get('id') in LINKS}
    assert len(originals) == len(LINKS)
    for item in data['tracks']:
        if item.get('id') in LINKS:
            item['links'] = {**item.get('links', {}), **LINKS[item['id']]}
            item['status'] = 'Disponible'
            if item['id'] == 'le-bizz-cest-bon-2-0':
                item['label'] = 'Disponible maintenant'
                item['description'] = "Le Bizz c'est bon 2.0 de Sparetdee Simon est disponible sur Spotify, Apple Music, YouTube Music et Deezer."
    for field in ('upcoming', 'countdowns'):
        data[field] = [item for item in data.get(field, []) if item.get('id') not in LINKS]
    data['featured'] = copy.deepcopy(next(item for item in data['tracks'] if item.get('id') == 'le-bizz-cest-bon-2-0'))
    save('data.json', data)
    for source in ('data/releases.json', 'data/music-library.json'):
        releases = read(source)
        for item in releases:
            if item.get('id') in LINKS:
                current = next(track for track in data['tracks'] if track.get('id') == item['id'])
                for field in ('links', 'status', 'description'):
                    item[field] = copy.deepcopy(current[field])
                if item['id'] == 'le-bizz-cest-bon-2-0':
                    item['label'] = 'Disponible maintenant'
        save(source, releases)
    save('data/countdowns.json', [item for item in read('data/countdowns.json') if item.get('id') not in LINKS])
    news = read('data/news.json')
    for item in news:
        if item.get('id') == 'le-bizz-cest-bon-2-0-presortie-20261024':
            item.update(title="Le Bizz c'est bon 2.0 — disponible maintenant", text="Le single de Sparetdee Simon est disponible sur Spotify, Apple Music, YouTube Music et Deezer.", url='/music/index.html#morceaux', buttonText='Écouter le titre', date='2026-11-23')
    story = {
        'id': 'mpbp-engineering-vitrine-20261123', 'date': '2026-11-23',
        'title': 'MPBP ouvre son univers Design & Software Engineering',
        'text': 'Découvrez le deuxième univers de MPBP 440 Corp. : logiciels, agents IA et créations numériques. Une prochaine mise à jour présentera davantage de captures et de projets. Les futurs essais en démo ou en ligne seront annoncés une fois prêts et vérifiés ; aucun logiciel n’est actuellement proposé à la vente.',
        'type': 'entreprise', 'image': 'assets/brand/v15/engineering-atelier-r3.webp',
        'url': '/engineering/', 'buttonText': 'Découvrir MPBP Engineering',
    }
    news = [item for item in news if item.get('id') != story['id']]
    news.insert(0, story)
    save('data/news.json', news)
    proof = ROOT / 'docs/v15/preuves/content-update-20261123.json'
    proof.write_text(json.dumps({'source': 'Liens et disponibilité fournis par le propriétaire le 23 novembre 2026 ; Apple Music Légalize corrigé dans son message complémentaire.', 'links': LINKS, 'originalTracks': originals, 'backupSha256': hashlib.sha256(backup.read_bytes()).hexdigest()}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Updated five releases, artist discographies, upcoming lists and Engineering news; all original covers retained.')
