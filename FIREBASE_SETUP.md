# Configuração necessária do Firestore

No Firebase Console, abra **Firestore Database > Regras** e publique temporariamente:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Estas regras permitem acesso público ao protótipo sem login. Antes de uso oficial, configure autenticação e regras restritas.

## Coleções usadas

- `ceos`
- `darkFiber`
- `ftthRedes`
- `clientesDedicados`
- `cabos`
- `fusoes`
- `arquivos`
- `anexos`

## Limite de arquivos

Sem Firebase Storage, o FibraPRO salva no Firestore o traçado processado do KMZ/KML. O arquivo original e arquivos OTDR são sincronizados somente até 650 KB, por causa do limite de 1 MiB por documento do Firestore.
