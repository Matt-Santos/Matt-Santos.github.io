---
layout: post
title:  "Document Signning"
bg: /assets/images/Misc/code_bg.jpg
---

## Background

It is often nessesary to validate the authenticity and integrity of digital documents to prevent various types of fraud, such as [man in the middle attacks](https://en.wikipedia.org/wiki/Man-in-the-middle_attack). The standard method for this validation is through digital signatures, which employ cryptographic protocols to ensure that the information originates from the claimed sender and has not been altered by a third party. Furthermore, this approach can also be used to encrypt the information, enhancing privacy and security. Many of my professional documents include digital signitures and I will accommodate requests to include them. The following guide outlines how to check for the presence of signatures as well as perform validation. For a more indepth overview I recommend reading the [GNU Privacy Handbook](https://www.gnupg.org/gph/en/manual.pdf) by John Ashley.

## Required Software

To process my digital signatures OpenPGP support is required. Several software tools implement this standard but I recommend using [GPG (GNU Privacy Guard)](https://gnupg.org/), which is a widely trusted implementation. GPG is available for all major operating systems and in some cases, it may even be pre-installed by default. While GPG is primarily a command-line tool, there are also various [graphical user interfaces (GUIs)](https://www.gnupg.org/software/frontends.html) available should you desire.

To check if GPG is already installed on your system, open your command line and enter:

```gpg2 -v```

If the command returns a version code then GPG is already present, otherwise install using the appropriate method for your operating system.

- ArchLinux: (sudo pacman -S gnupg)
- Ubuntu/Debian: (sudo apt install gnupg)
- Fedora/Redhat/CentOS: (sudo dnf install gnupg)
- macOS: (brew install gnupg)
- Windows: [Gpg4win Installer](https://gpg4win.org/download.html)
- [Prebuilt Binaries](https://gnupg.org/download/index.html#binary)
- [Source Code](https://gnupg.org/ftp/gcrypt/gnupg/)

## Importing the Keyfile

Prior to checking signatures you need to acquire a copy of the owner's public key. Often it is found on their website or hosted in public keyservers.

My keyfile can be found in two places:
- Hosted here: [https://matt-santos.github.io/assets/files/msantos_public_key.asc](https://matt-santos.github.io/assets/files/msantos_public_key.asc)
- The MIT Public Keyserver: [pgp.mit.edu](https://pgp.mit.edu/pks/lookup?op=get&search=0x8CAD5AA683A8AC5E)

Importing a downloaded keyfile is done using gpg with the *--import* arguement.

```gpg2 --import msantos_public_key.asc```

Alternatively gpg can automatically pull from keyservers by specifiying the server and keyID.

```gpg2 --keyserver pgp.mit.edu --receive-key 83A8AC5E```

Upon completion a key fingerprint will be output. This is used to verify you have the correct key. My key's fingerprint should exactly match the following:

```85CB31EF208B4C9E67AAC0CD8CAD5AA683A8AC5E``` 

## Identifying Signed Documents

There are 3 types of files you can recieve that incorperate a signature. The file extension can generally be used to distinguish between them.

1. Detached Signature (file + file.sig)
2. Binary Signature (file.gpg)
3. Clear Signed Signature (file or file.asc)

As evident from the name, detached signatures are seperate files that accompany the origional with an added *.sig* extension. This method of signing leaves the origional file unmodified so it can be accessed without having to perform verification. Conversely, binary signatures alter the origional by appending the signiture information directly and applying compression. This results in the signed file being unable to be read without first removing the signature. They often include the *.gpg* extension but this is not a strict requirement. Also be aware that files signed in this way are not encrypted. The last method of clear signing is a compramise whereby the signature information is still appended but compression is skipped to ensure the file remains readable. This does not always succed as certain filetypes are highly sensitive to modification. Plaintext based files are usually given the *.asc* extension when clearsigned but other file formats usually maintain their given extension.

## Validating Signatures

After importing the keyfile signiture verification is performed through the *--verify* arguement followed by the target file.

```gpg2 --verify filename```

To also extract the origional file from a binary signature include the *--decrypt* arguement.

```gpg2 --verify --decrypt filename```

For detached signatures simply include the associated *.sig* in the command

```gpg2 --verify filename.sig filename```

If your system reports *good signature* then validation was succesfull. In the event validation fails, further checks are required, or you wish to establish encrypted communications with me, then please reach out via [email](mailto:matthewsantos@ieee.org).