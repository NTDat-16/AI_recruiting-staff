import fakeredis
import sys

if __name__ == "__main__":
    print("Starting FakeRedis TCP Server on 127.0.0.1:6379...")
    sys.stdout.flush()
    server = fakeredis.TcpFakeServer(("127.0.0.1", 6379))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Stopping FakeRedis TCP Server...")
    finally:
        server.server_close()
